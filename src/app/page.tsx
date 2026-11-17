import Nav from "@/components/Nav";
import Reveals from "@/components/Reveals";
import Hero from "@/components/sections/Hero";
import Statement from "@/components/sections/Statement";
import Work from "@/components/sections/Work";
import Stack from "@/components/sections/Stack";
import Journey from "@/components/sections/Journey";
import Testimonial from "@/components/sections/Testimonial";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Work />
        <Stack />
        <Journey />
        <Testimonial />
        <About />
      </main>
      <Contact />
      <Reveals />
    </>
  );
}
