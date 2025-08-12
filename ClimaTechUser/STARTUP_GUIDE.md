# 🌤️ ClimaTech Weather System - Quick Start Guide

## 🚀 **Quick Start (2 Steps)**

### **1. Start Backend Weather System**
```bash
cd backend
conda activate ai
python app.py
```
**Backend will run on: http://localhost:5000**

### **2. Start Frontend**
```bash
cd ClimaTechUser
npm run dev
```
**Frontend will run on: http://localhost:3000**

## 🌦️ **Weather Features Available**

✅ **Real Weather Data**: Live data from Google Weather API  
✅ **Filipino Weather Conditions**: Authentic weather descriptions  
✅ **9 Philippine Cities**: Manila, Cebu, Davao, Baguio, and more  
✅ **Weather Icons**: Beautiful PNG icons for each condition  
✅ **Map Integration**: Weather markers on the interactive map  
✅ **Weather Section**: Dedicated weather dashboard  
✅ **Auto-Refresh**: Updates every 5 minutes  

## 🏙️ **Cities with Weather Data**

1. Manila
2. Quezon City  
3. Cebu City
4. Davao City
5. Iloilo City
6. Baguio
7. Zamboanga City
8. Cagayan de Oro
9. General Santos

## 🔧 **Optional: Update Weather Data**

To collect fresh weather data:
```bash
cd backend
python collect_frontend_cities_weather.py
```

## 📱 **Access Your Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Weather Section**: Click "Weather" in the navigation
- **Map Weather**: Click on city markers to see weather details

## 🎯 **What You'll See**

- **Weather Section**: Grid of Philippine cities with real weather data
- **Interactive Map**: Weather icons on city markers
- **Filipino Conditions**: Authentic weather descriptions like "Cloudy Skies with Rainshowers"
- **Live Data**: Real temperature, humidity, wind, and rainfall data
- **Beautiful Icons**: Weather condition PNG icons

---

**🎉 Everything is ready! Your weather integration is fully functional.**

For detailed technical information, see: `WEATHER_INTEGRATION.md` 