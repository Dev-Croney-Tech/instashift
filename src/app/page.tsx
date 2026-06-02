"use client";

import { useState } from "react";
import Header from "@/components/UI/header";
import Dashboard from "@/components/dashboard/dashboard";
import Footer from "@/components/UI/footer";

export default function Home() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <Header onReset={() => setResetKey((prev) => prev + 1)} />
      <Dashboard key={resetKey} />
      <Footer />
    </>
  );
}
