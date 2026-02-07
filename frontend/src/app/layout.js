import "./globals.css";

export const metadata = {
  title: "TradeBacktest - Futures Trading Simulator",
  description: "TradingView-style backtesting and futures trading simulator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
