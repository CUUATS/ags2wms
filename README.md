# AGS to WMS
ArcGIS Server to Web Map Service (WMS) proxy server

## Usage
```
npm run -- [ags_url] [token]
```
### Single Service
```
npm run -- http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Portland/Aerial/ImageServer myaccesstoken
```

### Multiple Services
```
npm run -- http://sampleserver3.arcgisonline.com/ArcGIS/rest/services myaccesstoken
```

### WMS
```
http://localhost:8000/Portland/Aerial/ImageServer?SERVICE=WMS&REQUEST=GetCapabilities
```
