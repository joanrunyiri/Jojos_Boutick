import httpx
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

async def debug_agents():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / ".env")
    api_key = os.environ.get("PICKUPMTAANI_API_KEY")
    
    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.pickupmtaani.com/api/v1/agents", headers={"apiKey": api_key})
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Type: {type(data)}")
        if isinstance(data, dict):
            print(f"Keys: {data.keys()}")
            agents = data.get("data", [])
            print(f"First agent: {agents[0] if agents else 'None'}")
        else:
            print(f"First agent: {data[0] if data else 'None'}")

if __name__ == "__main__":
    asyncio.run(debug_agents())
