import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./engine.css";
import "./runtime.css";
import "./adaptive.css";
import "./labs.css";
import "./course.css";
import "./harmony-fretboard.css";
import "./beast.css";
import "./beast-extra.css";
import "./performance.css";
import "./maqam.css";
import "./slap.css";
import "./egyptian-arabic.css";
const sans=Geist({variable:"--sans",subsets:["latin"]}); const mono=Geist_Mono({variable:"--mono",subsets:["latin"]});
export const metadata:Metadata={title:"Outside In — Bass Modes Lab",description:"A 28-week interactive bass improvisation course in modes, harmony and controlled outside playing."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
