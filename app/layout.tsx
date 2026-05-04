import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Social AI App",
  description: "Upload once, post everywhere",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}