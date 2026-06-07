import asyncio
import aiohttp
import os
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("AMADEUS_API_KEY")
API_SECRET = os.getenv("AMADEUS_API_SECRET")

app = FastAPI(title="Flight API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AIRLINES = {
    "FR": "Ryanair", "VY": "Vueling", "IB": "Iberia", "I2": "Iberia Express",
    "U2": "EasyJet", "UX": "Air Europa", "LH": "Lufthansa", "W6": "Wizz Air",
    "BA": "British Airways", "AF": "Air France", "AZ": "ITA Airways"
}

async def get_access_token(session):
    if not API_KEY or not API_SECRET:
        return None
    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": API_KEY,
        "client_secret": API_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    try:
        async with session.post(url, data=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("access_token")
            return None
    except Exception:
        return None

async def fetch_flights_by_destination(session, token, origin, destination_iata, date_obj, day_offset):
    url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    parameters = {
        "originLocationCode": origin,
        "destinationLocationCode": destination_iata,
        "departureDate": date_obj.strftime("%Y-%m-%d"),
        "adults": 1,
        "nonStop": "true",
        "max": 10
    }
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with session.get(url, params=parameters, headers=headers) as response:
            if response.status != 200:
                return []
            data = await response.json()
            processed_flights = []
            for offer in data.get("data", []):
                try:
                    itinerary = offer["itineraries"][0]["segments"][0]
                    departure_time = datetime.fromisoformat(itinerary["departure"]["at"])
                    carrier_code = itinerary["carrierCode"]
                    total_price = float(offer["price"]["total"])
                    
                    flight_item = {
                        "dayOffset": day_offset,
                        "hour": departure_time.hour,
                        "dest": destination_iata,
                        "company": AIRLINES.get(carrier_code, carrier_code),
                        "price": int(total_price)
                    }
                    processed_flights.append(flight_item)
                except (KeyError, IndexError):
                    continue
            return processed_flights
    except Exception:
        return []

def generate_simulation_data(destination_iata):
    simulated_flights = []
    companies = list(AIRLINES.values())
    for day_offset in range(7):
        num_flights = random.randint(3, 7)
        for _ in range(num_flights):
            flight_item = {
                "dayOffset": day_offset,
                "hour": random.randint(6, 23),
                "dest": destination_iata,
                "company": random.choice(companies),
                "price": random.randint(25, 180)
            }
            simulated_flights.append(flight_item)
    return simulated_flights

@app.get("/api/flights")
async def get_flights(destination: str = Query(...)):
    current_date = datetime.now()
    total_flights = []
    
    async with aiohttp.ClientSession() as session:
        token = await get_access_token(session)
        
        if not token:
            return generate_simulation_data(destination)
            
        tasks = []
        for day_offset in range(7):
            search_date = current_date + timedelta(days=day_offset)
            tasks.append(
                fetch_flights_by_destination(session, token, "MAD", destination, search_date, day_offset)
            )
        
        results = await asyncio.gather(*tasks)
        for flight_list in results:
            total_flights.extend(flight_list)
            
    return total_flights