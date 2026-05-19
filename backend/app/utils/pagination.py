from sqlalchemy.orm import Query

def paginate(query: Query, page: int = 1, size: int = 20) -> dict:
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size, "pages": (total + size - 1) // size}
