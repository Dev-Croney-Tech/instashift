import Header from "@/components/UI/header";
import Dashboard from "@/components/dashboard/dashboard";
import Footer from "@/components/UI/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
