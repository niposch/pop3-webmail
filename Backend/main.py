import datetime
import multiprocessing
import quopri
import os
from multiprocessing import Pool
from queue import Queue

from dotenv import load_dotenv
import re
import poplib
from email.utils import parsedate_to_datetime
from flask import Flask, request, make_response, redirect, url_for, send_from_directory, jsonify
from flanker import mime, utils
from flanker.addresslib import address

from Backend.Message import Message
from multiprocessing.pool import ThreadPool
if __name__ == '__main__':
    load_dotenv()
    port = os.getenv("PORT", 8081)
    is_dev = os.getenv("IS_DEVELOPMENT", "false").lower() == "true"
    app = Flask(__name__)


    def setup_poplib(address: str, username: str, password: str, isSSL: bool):
        # inspired by:
        # https://uibakery.io/regex-library/url
        # https://ihateregex.io/expr/port/
        address_regex = r'^([-a-zA-Z0-9@%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@%_\+.~#?&\/=]*))(?::(\d+))?'
        matches = re.match(address_regex, address)
        groups = matches.groups()
        port = None  # initialize Port to None
        if len(groups) == 1:
            address = groups[0]
            port = 110
        elif len(groups) == 2:
            address = groups[0]
            try:
                port = int(groups[1])
                if port > 65535:
                    raise Exception('Invalid port')
            except:
                raise Exception('Invalid port')
        else:
            raise Exception('Invalid address')

        try:
            if port is None:
                port = 110
            if isSSL:
                m = poplib.POP3_SSL(address, port)
            else:
                m = poplib.POP3(address, port)
            m.user(username)
            m.pass_(password)
        except:
            raise Exception('Invalid address')
        try:
            m = m.utf8()
        except:
            # utf8 is not supported
            pass
        return m


    @app.post("/api/authenticate")
    def authenticate():
        url = request.args.get("url")
        password = request.args.get("password")
        username = request.args.get("username")
        isSSL = request.args.get("usessl", "false").lower() == "true"
        if url == None or password == None or username == None:
            return "bad request", 400
        try:
            m = setup_poplib(url, username, password, isSSL)
        except:
            return "invalid credentials", 401
        m.quit()
        # store the credentials in a cookie
        return "authenticated", 200


    def chunks(start, end, chunkSize:int):
        outp = []
        for i in range(start-1, end, chunkSize):
            outp.append((i+1, min(i+chunkSize, end)))
        return outp


    @app.get("/api/emails")
    def get_emails():
        # get url password and username from route
        url = request.args.get("url")
        username = request.args.get("username")
        password = request.args.get("password")
        isSSL = request.args.get("usessl", "false").lower() == "true"
        default_limit = None
        default_offset = 0
        offset = request.args.get("chunk", 0)
        limit = request.args.get("limit", default_limit)
        useCache = request.args.get("usecache", "true").lower() == "true"
        if url == None or password == None or username == None:
            return "bad request", 400

        try:
            m = setup_poplib(url, username, password, isSSL)
        except:
            try_invalidate_cache(url, username, password, isSSL)
            return "invalid credentials", 401

        # try get from cache
        if useCache:
            emails = try_get_from_cache(url, username, password, isSSL, 24 * 60 * 60)
            if emails != None:
                return jsonify(emails), 200

        messages = []
        # retrieve the messages
        if limit is None:
            limit = len(m.list()[1])
            default_limit = limit
        if limit > len(m.list()[1]):
            limit = len(m.list()[1])

        retrieveds = []
        for i in range(1, limit):
            retrieveds.append((url, i, m.retr(i)))
            print(f"downloaded #{i}")
        with Pool(processes=multiprocessing.cpu_count()) as pool:
            messages = pool.map(parseEmail, retrieveds)
        if limit == default_limit and offset == default_offset:
            cacheEmails(url, username, password, isSSL, messages)
        return jsonify(messages), 200


def parseEmail(inp)->Message:
    # url, number, retrieved
    url = inp[0]
    number = inp[1]
    retrieved = inp[2]
    msg = b'\n'.join(retrieved[1])
    msg = quopri.decodestring(msg)
    # msg = msg.decode("utf-8", "replace")
    msg = mime.from_string(msg)
    receivedTime = datetime.datetime.min
    if msg.headers.get("Date") is not None:
        receivedTime = parsedate_to_datetime(msg.headers.get("Date"))

    parse_res = address.parse(msg.headers.get("From"))
    if parse_res is not None:
        sender_name = parse_res.display_name
        sender_mail = parse_res.address
    else:
        sender_mail = msg.headers.get("From")
        sender_name = None

    parse_res = address.parse(msg.headers.get("To"))
    if parse_res is not None:
        receiver_name = parse_res.display_name
        receiver_mail = parse_res.address
    else:
        receiver_mail = msg.headers.get("To")
        receiver_name = None

    print(f"completed {number}")
    di = Message.getDict(msg.subject, msg.body, (sender_name, sender_mail), (receiver_name, receiver_mail), receivedTime, url, msg.headers.items())
    return json.dumps(di, default=json_util.default)


import hashlib
from bson import json_util
def cacheEmails(url, username, password, usessl, emails):
    creds = (url + username + password + str(usessl)).encode("utf-8")
    user_hash = hashlib.sha512(creds).hexdigest()
    with open(f"./cache/{user_hash}", "wb") as f:
        email_cache = {}
        email_cache["Date"] = datetime.datetime.now()
        email_cache["Data"] = emails
        email_cache = json.dumps(email_cache, default=json_util.default)
        f.write(email_cache.encode("utf-8"))

import json
# acceptable age is in seconds
def try_get_from_cache(url, username, password, usessl, acceptable_age:int):
    creds = (url + username + password + str(usessl)).encode("utf-8")
    user_hash = hashlib.sha512(creds).hexdigest()
    try:
        with open(f"./cache/{user_hash}", "rb") as f:
            contents = f.read().decode("utf-8")
            email_cache = json.loads(contents, object_hook=json_util.object_hook)
        if email_cache["Date"] + datetime.timedelta(seconds=acceptable_age) > datetime.datetime.now():
            return email_cache["Data"]
    except:
        print("cache retrieval failed")
        try_invalidate_cache(url, username, password, usessl)
    return None

def try_invalidate_cache(url, username, password, usessl):
    creds = (url + username + password + str(usessl)).encode("utf-8")
    user_hash = hashlib.sha512(creds).hexdigest()
    try:
        os.remove(f"./cache/{user_hash}")
    except:
        print("cache invalidation failed")

if __name__ == '__main__':
    if not os.path.exists("./cache"):
        os.mkdir("./cache")
    app.run(port=port, debug=is_dev)
