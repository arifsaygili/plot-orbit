import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const theme = createTheme({
  primaryColor: "teal",
  fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          color: "var(--mantine-color-dark-7)",
          fontWeight: 500,
          marginBottom: 6,
        },
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        label: {
          color: "var(--mantine-color-dark-7)",
          fontWeight: 500,
          marginBottom: 6,
        },
      },
    },
    Checkbox: {
      styles: {
        label: {
          color: "var(--mantine-color-dark-6)",
        },
      },
    },
    InputWrapper: {
      styles: {
        label: {
          color: "var(--mantine-color-dark-7)",
          fontWeight: 500,
          marginBottom: 6,
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
  },
});

export const metadata: Metadata = {
  title: "ParselShot - KML'den Profesyonel Emlak Videoları",
  description: "Emlak ilanlarınız için profesyonel orbit videoları saniyeler içinde oluşturun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
