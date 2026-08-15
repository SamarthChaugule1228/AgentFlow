from app.services.store import get_documents
docs = get_documents()
if docs:
    for doc in docs:
        print("FILE:", doc['filename'])
        print("\nCONTENT (first 1500 chars):")
        print(doc['content'][:1500])
        print("\n\nSTRUCTURED DATA:")
        for key, value in doc.get('structured_data', {}).items():
            print(f"  {key}:")
            if isinstance(value, list):
                for item in value[:5]:
                    print(f"    - {item}")
            else:
                print(f"    {value}")
        print("\n" + "="*80)
else:
    print("No documents found")
