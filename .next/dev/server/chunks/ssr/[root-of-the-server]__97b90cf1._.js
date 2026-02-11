module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/components/CrowdRadar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CrowdRadar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mapbox-gl/dist/mapbox-gl.js [app-ssr] (ecmascript)");
"use client";
;
;
;
const TOKEN = ("TURBOPACK compile-time value", "pk.eyJ1IjoicHNqMDYxMCIsImEiOiJjbWxmNXNnYWMwMWJsM2twczVjZ2tnNTQ0In0.3Swjfb8RYBBMp7UsNi71-g") || "";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].accessToken = TOKEN;
const GANGNAM_STATION = {
    lat: 37.498095,
    lng: 127.027610
};
// 🛑 MANUAL DATA (Our 10 Cafes)
const REAL_CAFES = [
    {
        name: "Starbucks Gangnam R",
        lat: 37.4978,
        lng: 127.0286,
        busyness: 9
    },
    {
        name: "Blue Bottle Coffee",
        lat: 37.4971,
        lng: 127.0282,
        busyness: 5
    },
    {
        name: "Starbucks Yeoksam",
        lat: 37.4992,
        lng: 127.0295,
        busyness: 7
    },
    {
        name: "Twosome Place",
        lat: 37.4985,
        lng: 127.0260,
        busyness: 3
    },
    {
        name: "Ediya Coffee",
        lat: 37.4965,
        lng: 127.0255,
        busyness: 2
    },
    {
        name: "Coffee Bean & Tea Leaf",
        lat: 37.4988,
        lng: 127.0278,
        busyness: 6
    },
    {
        name: "Mega Coffee",
        lat: 37.4975,
        lng: 127.0290,
        busyness: 8
    },
    {
        name: "Paul Bassett",
        lat: 37.4995,
        lng: 127.0265,
        busyness: 4
    },
    {
        name: "Dunkin' Gangnam",
        lat: 37.4968,
        lng: 127.0270,
        busyness: 5
    },
    {
        name: "Hollys Coffee",
        lat: 37.4982,
        lng: 127.0250,
        busyness: 3
    }
];
function CrowdRadar() {
    const mapContainer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const map = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("SYSTEM ONLINE");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (map.current) return;
        if (!mapContainer.current) return;
        map.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [
                GANGNAM_STATION.lng,
                GANGNAM_STATION.lat
            ],
            zoom: 16,
            pitch: 45
        });
        map.current.on('load', ()=>loadManualData(map.current));
        // CLICK INTERACTION
        map.current.on('click', 'cafe-dots', (e)=>{
            if (!e.features?.[0]) return;
            const feature = e.features[0];
            if (feature.geometry.type !== 'Point') return;
            const coordinates = feature.geometry.coordinates.slice();
            const props = feature.properties;
            if (!props) return;
            // Create the popup (Styles are in globals.css)
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Popup({
                closeButton: true
            }).setLngLat(coordinates).setHTML(`
          <div style="text-align: center;">
            <h3 style="margin: 0; font-size: 16px; color: #33ff33;">${props.name}</h3>
            <div style="margin-top: 5px; font-size: 12px; color: #ccc;">
              CROWD LEVEL: <span style="color: white; font-weight: bold;">${props.busyness}/10</span>
            </div>
            <div style="margin-top: 8px; width: 100%; height: 4px; background: #333;">
              <div style="width: ${props.busyness * 10}%; height: 100%; background: ${props.color}; box-shadow: 0 0 5px ${props.color};"></div>
            </div>
          </div>
        `).addTo(map.current);
        });
        map.current.on('mouseenter', 'cafe-dots', ()=>map.current.getCanvas().style.cursor = 'pointer');
        map.current.on('mouseleave', 'cafe-dots', ()=>map.current.getCanvas().style.cursor = '');
    }, []);
    // 🚁 TELEPORT FUNCTION (SMARTER VERSION)
    const flyToMe = ()=>{
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setStatus("LOCATING USER...");
        // Options: Be accurate, but give up after 5 seconds
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        navigator.geolocation.getCurrentPosition((position)=>{
            const { latitude, longitude } = position.coords;
            map.current?.flyTo({
                center: [
                    longitude,
                    latitude
                ],
                zoom: 14,
                essential: true
            });
            // Blue Marker for YOU
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].Marker({
                color: '#3b82f6',
                scale: 1.2
            }).setLngLat([
                longitude,
                latitude
            ]).addTo(map.current);
            setStatus("USER LOCATED");
        }, (error)=>{
            console.error(error);
            // If it fails, fallback to Seoul City Hall just to show movement
            setStatus("GPS ERROR. TELEPORTING TO CITY HALL...");
            map.current?.flyTo({
                center: [
                    126.9780,
                    37.5665
                ],
                zoom: 14
            });
        }, options);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                href: "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css",
                rel: "stylesheet"
            }, void 0, false, {
                fileName: "[project]/components/CrowdRadar.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: mapContainer,
                style: {
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }
            }, void 0, false, {
                fileName: "[project]/components/CrowdRadar.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    padding: '10px 15px',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#33ff33',
                    fontFamily: 'monospace',
                    border: '1px solid #33ff33',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(51, 255, 51, 0.2)',
                    zIndex: 10
                },
                children: [
                    "⚡ ",
                    status
                ]
            }, void 0, true, {
                fileName: "[project]/components/CrowdRadar.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: flyToMe,
                style: {
                    position: 'absolute',
                    bottom: 30,
                    right: 30,
                    background: '#33ff33',
                    color: 'black',
                    border: 'none',
                    padding: '15px 25px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    cursor: 'pointer',
                    borderRadius: '50px',
                    boxShadow: '0 0 20px rgba(51, 255, 51, 0.6)',
                    zIndex: 10
                },
                children: "📍 LOCATE ME"
            }, void 0, false, {
                fileName: "[project]/components/CrowdRadar.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/CrowdRadar.tsx",
        lineNumber: 118,
        columnNumber: 5
    }, this);
    //TURBOPACK unreachable
    ;
    function loadManualData(map) {
        const features = REAL_CAFES.map((cafe)=>({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        cafe.lng,
                        cafe.lat
                    ]
                },
                properties: {
                    name: cafe.name,
                    busyness: cafe.busyness,
                    color: cafe.busyness > 7 ? '#ef4444' : cafe.busyness > 4 ? '#eab308' : '#22c55e'
                }
            }));
        map.addSource('cafes', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: features
            }
        });
        map.addLayer({
            id: 'cafe-dots',
            type: 'circle',
            source: 'cafes',
            paint: {
                'circle-radius': 8,
                'circle-color': [
                    'get',
                    'color'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-blur': 0.2
            }
        });
        setStatus(`ONLINE: ${features.length} NODES ACTIVE`);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__97b90cf1._.js.map