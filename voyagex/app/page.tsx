import AboutSection from "@/Components/about_section";
import AgenciesSection from "@/Components/agencies_section";
import ExploreSection from "@/Components/explore_section";
import Footer from "@/Components/footer";
import GuidesSection from "@/Components/guide_section";
import Hero from "@/Components/hero";
import PackagesSection from "@/Components/package_section";
import TestimonialSection from "@/Components/testimonial";





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
