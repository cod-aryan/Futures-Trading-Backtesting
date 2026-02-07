import "./globals.css";

export const metadata = {
  title: "TradeBacktest - Futures Trading Simulator",
  description: "TradingView-style backtesting and futures trading simulator",
};

export const viewport = {
  width: 1280,
  initialScale: 1,
  minimumScale: 0.1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
