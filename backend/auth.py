from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("SECRET_KEY")

security = HTTPBearer()


def hash_pass(password):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    return hashed.decode()


def check_pass(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(data):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=2)
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def decode(token):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data
    except:
        raise HTTPException(status_code=401, detail="Invalid token")