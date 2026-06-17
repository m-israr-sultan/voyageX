import AboutSection from "@/components/aboutsection";
import AgenciesSection from "@/components/agenciessection";
import Footer from "@/components/footer";
import GuidesSection from "@/components/guidesection";
import Hero from "@/components/hero";
import PackagesSection from "@/components/package_section";
import TestimonialSection from "@/components/testimonial";
import ExploreSection from "@/components/exploresection";






export default function Home() {
  return (
    <div className="min-h-screen">
      {/* If Navigation is not in layout */}
      <div className="container mx-auto px-4">
       
      </div>
      
      {/* Hero Section */}
      <Hero/>
      
      {/* Rest of your homepage content */}
      <section className="container mx-auto px-4 py-16">
        {/* explore Section  */}
          <ExploreSection/>
         {/* explore Section  */}

         {/*Package Section */}
            <PackagesSection/>
         {/*Package Section */}

         {/*Agencies Section */}

          <AgenciesSection/>
         {/*Agencies Section */}

         {/*guide Section */}

          <GuidesSection/>
         {/*guide Section */}

         {/*about us Section */}

          <AboutSection/>
         {/*about us Section */}

         {/*testimonial Section */}

          <TestimonialSection/>
         {/*testimonail  Section */}

          {/*Footer Section */}

          <Footer/>
         {/*Footer Section */}
      </section>
    </div>
  );
}
