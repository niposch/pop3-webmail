import os

from dotenv import load_dotenv
import re
import poplib
from flask import Flask, request, make_response, redirect, url_for, send_from_directory

if __name__ == '__main__':
    load_dotenv()
    dev_port = os.getenv("DEV_PORT", 8081)
    prod_port = os.getenv("PROD_PORT", 8080)
    fe_port = os.getenv("FRONTEND_DEV_PORT", 8080)
    is_dev = os.getenv("IS_DEVELOPMENT", "false").lower() == "true"
    port = prod_port
    if is_dev:
        print("Development Mode Enabled. This will only start the backend.")
        print("You might want to run npm run start in the frontend folder.")
        port = dev_port
        static_folder = "static"

        app = Flask(__name__, static_folder=static_folder, static_url_path="")
        # setup redirect to the frontend
        @app.route('/')
        def redirect_handler():
            return redirect(f'http://127.0.0.1:{fe_port}',302)
    else:
        fe_dist = os.getenv("FRONTEND_PROD_DIST_FOLDER", "../Frontend/dist/Frontend")
        static_folder = fe_dist
        if not os.path.exists(fe_dist):
            raise Exception("Frontend dist folder not found!\nYou might want to run 'npm i && npm run build' from ../Frontend.\n")
        app = Flask(__name__, static_folder=static_folder, static_url_path="")
        @app.route("/")
        def index():
            return send_from_directory(fe_dist, "index.html")
        @app.route('/<path:path>')
        def serve(path):
            # serve from directory
            return send_from_directory(fe_dist, path)


def setup_poplib(address:str, username:str, password:str):
    address_regex = r'^([-a-zA-Z0-9@%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@%_\+.~#?&\/=]*))(?:\:((?:6553[0-5])|(?:655[0-2][0-9])|(?:65[0-4][0-9]{2})|(?:6[0-4][0-9]{3})|(?:[1-5][0-9]{4})|(?:[0-5]{0,5})|(?:[0-9]{1,4})))?'
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
        except:
            raise Exception('Invalid port')
    else:
        raise Exception('Invalid address')

    m = poplib.POP3(address, port)
    m.user(username)
    m.pass_(password)
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
    res = make_response("authenticated")
    res.set_cookie("url", url)
    res.set_cookie("username", username)
    res.set_cookie("password", password)

    return res
# url, username, password
def get_credentials_from_cookie()->(str, str, str):
    url = request.cookies.get("url")
    username = request.cookies.get("username")
    password = request.cookies.get("password")
    if url == None or username == None or password == None:
        raise Exception("Not authenticated!")
    return url, username, password

@app.get("/api/emails/")
def get_emails():
    # inspired by:
        # https://uibakery.io/regex-library/url
        # https://ihateregex.io/expr/port/
    try:
        url, username, password = get_credentials_from_cookie()
    except:
        return "unauthorized", 401

    m = setup_poplib(url, username, password)
    numMessages = len(m.list()[1])
    print(numMessages)
    # retrieve the first message text
    response = m.retr(1)
    return str(numMessages)


if __name__ == '__main__':
    app.run(port=port, debug=is_dev)

