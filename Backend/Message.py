import datetime


class Message:
    @staticmethod
    def getDict(subject:str, body:str, sender:str, receiver:str, date:datetime.datetime, server:str, headers:list[tuple[str, any]]):
        d = {}
        d["subject"] = subject
        d["body"] = body
        d["sender"] = sender
        d["receiver"] = receiver
        d["date"] = date
        d["server"] = server
        d["headers"] = {}
        for el in headers:
            d["headers"][el[0]] = el[1]
        return d
