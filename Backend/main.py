import datetime
import os
from dotenv import load_dotenv
import re
import poplib
from email import parser
from flask import Flask, request, make_response, redirect, url_for, send_from_directory, jsonify

from Backend.Message import Message

load_dotenv()
port = os.getenv("PORT", 8081)
is_dev = os.getenv("IS_DEVELOPMENT", "false").lower() == "true"
app = Flask(__name__)

def setup_poplib(address:str, username:str, password:str):
    # inspired by:
    # https://uibakery.io/regex-library/url
    # https://ihateregex.io/expr/port/
    address_regex = r'^([-a-zA-Z0-9@%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@%_\+.~#?&\/=]*))(?::(\d+))?'
    matches = re.match(address_regex, address)
    if matches == None:
        raise Exception('Invalid address')
    groups = matches.groups()
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
        m = poplib.POP3(address, port, timeout=3)
        m.user(username)
        m.pass_(password)
    except:
        raise Exception('Invalid address')
    return m


@app.post("/api/authenticate")
def authenticate():
    url = request.args.get("url")
    password = request.args.get("password")
    username = request.args.get("username")
    if url == None or password == None or username == None:
        return "bad request", 400
    try:
        m = setup_poplib(url, username, password)
    except:
        return "invalid credentials", 401
    m.quit()
    # store the credentials in a cookie
    return "authenticated", 200

@app.get("/api/emails")
def get_emails():
    # get url password and username from route
    url = request.args.get("url")
    username = request.args.get("username")
    password = request.args.get("password")

    if url == None or password == None or username == None:
        return "bad request", 400

    try:
        m = setup_poplib(url, username, password)
    except:
        return "invalid credentials", 401

    messages = []
    # retrieve the messages
    for i in range(1, len(m.list()[1]) + 1):
        msg = m.retr(i)
        msg = "\n".join(list(map(lambda x: x.decode('utf-8'), msg[1])))
        msg = parser.Parser().parsestr(msg)
        messages.append(Message.getDict(msg.get("Subject"), msg.get_payload(), msg.get("From"), msg.get("To"), datetime.datetime.strptime(msg.get("Date"), "%a, %d %b %Y %H:%M:%S %z"), url, msg.items()))
    return jsonify(messages), 200


if __name__ == '__main__':
    app.run(port=port, debug=is_dev)