export const MAP_PATHS: Record<string, string> = {
    // NORTH AMERICA (Unchanged)
    alaska: "M 10,60 L 60,60 L 50,100 L 10,90 Z",
    nw_territory: "M 60,60 L 140,60 L 130,100 L 50,100 Z",
    greenland: "M 160,20 L 240,10 L 240,80 L 160,70 Z",
    alberta: "M 50,100 L 130,100 L 120,140 L 50,130 Z",
    ontario: "M 130,100 L 190,100 L 180,150 L 120,140 Z",
    quebec: "M 190,100 L 250,100 L 240,150 L 180,150 Z",
    western_us: "M 50,130 L 120,140 L 110,190 L 50,180 Z",
    eastern_us: "M 120,140 L 190,150 L 170,200 L 110,190 Z",
    central_america: "M 60,180 L 110,190 L 120,240 L 80,250 Z",

    // SOUTH AMERICA (Unchanged)
    venezuela: "M 140,240 L 220,240 L 200,280 L 140,270 Z",
    peru: "M 130,270 L 200,280 L 190,340 L 140,320 Z",
    brazil: "M 220,240 L 280,280 L 250,360 L 200,280 Z",
    argentina: "M 150,320 L 190,340 L 180,440 L 160,440 Z",

    // AFRICA (Unchanged, just Adjacency updates logic-side)
    north_africa: "M 320,220 L 420,220 L 410,290 L 330,280 Z",
    egypt: "M 420,220 L 480,220 L 470,260 L 410,290 Z",
    east_africa: "M 430,290 L 500,300 L 470,380 L 430,350 Z",
    congo: "M 380,290 L 430,290 L 430,350 L 390,340 Z",
    south_africa: "M 390,340 L 470,380 L 450,440 L 400,430 Z",
    madagascar: "M 510,360 L 540,360 L 530,410 L 500,400 Z",

    // EUROPE (Modified)
    iceland: "M 320,50 L 360,60 L 350,80 L 310,70 Z",

    // NEW: Ireland (Split from GB)
    ireland: "M 285,100 L 315,100 L 310,130 L 290,120 Z",
    // Modified: GB (Shrunk left side)
    great_britain: "M 320,90 L 360,90 L 350,130 L 315,130 Z",

    scandinavia: "M 380,40 L 440,40 L 430,90 L 390,90 Z",
    northern_europe: "M 370,100 L 430,100 L 420,140 L 360,130 Z",
    western_europe: "M 310,130 L 360,130 L 370,190 L 300,190 Z",
    southern_europe: "M 370,140 L 430,140 L 420,190 L 370,190 Z",

    // NEW: Leningrad (Split from Ukraine Top)
    leningrad: "M 440,50 L 520,50 L 515,90 L 435,90 Z",
    // Modified: Ukraine (Shrunk Top)
    ukraine: "M 435,90 L 515,90 L 510,140 L 440,130 Z",

    // ASIA (Modified)
    // NEW: Turkey (Wedged between S.Europe, Ukraine, Middle East)
    turkey: "M 420,160 L 470,160 L 465,190 L 430,185 Z",
    // Modified: Middle East (Pushed down slightly)
    middle_east: "M 465,190 L 540,200 L 530,260 L 450,230 Z",

    ural: "M 520,40 L 580,40 L 570,140 L 520,130 Z",
    siberia: "M 580,30 L 660,30 L 650,100 L 580,100 Z",
    yakutsk: "M 660,30 L 730,30 L 720,80 L 660,90 Z",
    kamchatka: "M 730,30 L 790,30 L 780,100 L 730,90 Z",
    irkutsk: "M 620,100 L 700,90 L 690,130 L 630,130 Z",
    mongolia: "M 630,130 L 720,120 L 710,170 L 640,170 Z",
    japan: "M 750,120 L 790,130 L 780,180 L 740,170 Z",
    afghanistan: "M 520,140 L 600,140 L 590,200 L 510,190 Z",
    china: "M 600,150 L 700,170 L 680,240 L 590,230 Z",
    india: "M 560,230 L 630,240 L 610,310 L 550,290 Z",
    siam: "M 630,240 L 690,240 L 680,300 L 640,300 Z",

    // AUSTRALIA (Unchanged)
    indonesia: "M 630,320 L 720,320 L 710,360 L 650,360 Z",
    new_guinea: "M 730,310 L 790,320 L 780,360 L 730,350 Z",
    western_australia: "M 660,380 L 730,380 L 720,460 L 660,450 Z",
    eastern_australia: "M 730,380 L 790,380 L 780,460 L 730,460 Z"
};