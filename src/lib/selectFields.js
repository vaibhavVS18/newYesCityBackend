// src/config/selectFields.js
const SELECT_FIELDS = {
  Accommodation: "_id cityName flagship hotels roomTypes images premium",
  Activity: "_id cityName topActivities images premium",
  CityInfo: "_id cityName stateOrUT alternateNames coverImage premium",
  Connectivity: "_id cityName nearestAirportStationBusStand distance premium",
  Food: "_id cityName flagship foodPlace vegOrNonVeg menuSpecial images premium",
  HiddenGem: "_id cityName hiddenGem images premium",
  Itinerary: "_id cityName day1 day2 day3 premium",
  Misc: "_id cityName hospital Police parking publicWashrooms locker premium",
  NearbySpot: "_id cityName places description images premium",
  Place: "_id cityName places establishYear description images premium",
  Shop: "_id cityName flagship shops famousFor images premium",
  Transport: "_id cityName from to premium",
};

export default SELECT_FIELDS;
