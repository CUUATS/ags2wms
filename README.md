# AGS to WMS
ArcGIS Server to Web Map Service (WMS) proxy server

## Configuration
```json
{
  "password": "mypassword",
  "token": "myoptionaltoken",
  "tokenUrl": "http://sampleserver3.arcgisonline.com/ArcGIS/tokens",
  "url": "http://sampleserver3.arcgisonline.com/ArcGIS/rest/services",
  "user": "myusername",
}
```

## Usage
```
npm run -- config.json
```

## WMS
```
http://localhost:8000/Portland/Aerial/ImageServer?SERVICE=WMS&REQUEST=GetCapabilities
```
