import { NextResponse } from 'next/server';

export async function GET() {
  const SEOUL_API_KEY = process.env.SEOUL_API_KEY;
  const AREA_NAME = encodeURIComponent('강남역'); 
  const SEOUL_API_URL = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/citydata_ppltn/1/5/${AREA_NAME}?random=${Date.now()}`;

  try {
    const response = await fetch(SEOUL_API_URL, { cache: 'no-store' });
    const buffer = await response.arrayBuffer();
    
    // 1. Basic Decode
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer).replace(/[\x00-\x1F\x7F]/g, "");
    
    const data = JSON.parse(text);
    const rawData = data['SeoulRtd.citydata_ppltn'][0];

    // 2. Extract REAL NUMBERS
    const min = parseInt(rawData.AREA_PPLTN_MIN);
    const max = parseInt(rawData.AREA_PPLTN_MAX);
    const currentPopulation = (min + max) / 2;

    // 3. Determine Status (Using English Codes)
    let status = "NORMAL";
    if (currentPopulation > 70000) status = "BUSY";
    if (currentPopulation > 90000) status = "VERY_BUSY";
    if (currentPopulation < 30000) status = "QUIET";

    return NextResponse.json({
      success: true,
      location: "Gangnam Station",
      status: status, // "BUSY", "NORMAL", etc.
      population: currentPopulation,
      message: `Live Population: ${min} ~ ${max} people`
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({
      success: false,
      status: "NORMAL", // Fallback
      population: 40000,
      message: "Using Backup Data"
    });
  }
}