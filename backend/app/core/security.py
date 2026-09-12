def create_token(user_id: str) -> str:
    return f"mock-jwt-{user_id}"


def verify_token(token: str):
    if token.startswith("mock-jwt-"):
        return token.replace("mock-jwt-", "")
    return None
