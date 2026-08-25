"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const leadershipData = [
  {
    "name": "Rohan Singh",
    "role": "General Manager",
    "dept": "EEE Dept. - 4th Year",
    "img": "/Innovation Garage Team/GMs/Profile_Pic_Rohan.png",
    "link": "https://www.linkedin.com/in/rohan-singh-main"
  },
  {
    "name": "Anirvesh Mangipudi",
    "role": "General Manager",
    "dept": "ECE Dept. - 4th Year",
    "img": "/updated_teams/Anirvesh.png",
    "link": "https://www.linkedin.com/in/anirvesh-mangipudi-7112222b7?utm_source=share_via&utm_content=profile&utm_medium=member_android"
  }
];

const teamData = {
  "SF & Outreach": [
    {
      "name": "Lavanya Trivedi",
      "role": "Team Lead",
      "dept": "Chemical Dept. - 4th Year",
      "img": "/updated_teams/Lavanya.png",
      "link": "https://www.linkedin.com/in/lavanyatrivedi"
    },
    {
      "name": "Vaishnavi",
      "role": "Team Lead",
      "dept": "4th Year",
      "img": "/Innovation Garage Team/SF and Outreach/Vaishnavi_Kuppa.jpg",
      "link": "https://www.linkedin.com/in/vaishnavi-kuppa-436650301?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      "name": "Akshay Kumar Korepu",
      "role": "Executive Member",
      "dept": "MNC Dept. - 3rd Year",
      "img": "/Innovation Garage Team/SF and Outreach/Akshay_kumar.jpeg",
      "link": "https://www.linkedin.com/in/akshaykumarkorepu"
    },
    {
      "name": "Shambhavi Dhange",
      "role": "Executive Member",
      "dept": "Mathematics and Computing Dept. - 3rd Year",
      "img": "/updated_teams/Shambhavi.png",
      "link": "https://www.linkedin.com/in/shambhavi-dhange-768049343"
    },
    {
      "name": "Roy Harwani",
      "role": "Executive Member",
      "dept": "MNC Dept. - 3rd Year",
      "img": "/Innovation Garage Team/SF and Outreach/Roy_Harwani.jpg",
      "link": "https://www.linkedin.com/in/roy-harwani-5030a6312/"
    },
    {
      "name": "Parth Gupta",
      "role": "Associate Member",
      "dept": "Mechanical Dept. - 2nd Year",
      "img": "/Innovation Garage Team/SF and Outreach/Parth_Gupta.JPG",
      "link": "https://www.linkedin.com/in/parth-gupta-3a2877370?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
    },
    {
      "name": "Rahil Jain",
      "role": "Associate Member",
      "dept": "EEE Dept. - 2nd Year",
      "img": "/Innovation Garage Team/SF and Outreach/Rahil_Jain.jpg",
      "link": "https://www.linkedin.com/in/rahil-jain-a57a2a375"
    },
    {
      "name": "Anurag sharma",
      "role": "Associate Member",
      "dept": "Chemical Dept. - 2nd Year",
      "img": "/Innovation Garage Team/SF and Outreach/Anurag_Sharma.jpg",
      "link": "https://www.linkedin.com/in/anurag-sharma-3642ab382?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    }
  ],
  "Tech & AI": [
    {
      "name": "Vedant Amit Agrawal",
      "role": "Team Lead",
      "dept": "CSE Dept. - 4th Year",
      "img": "/updated_teams/Vedant.png",
      "link": "https://www.linkedin.com/in/vedant-agrawal-0ba2a7325/"
    },
    {
      "name": "Koushik Sai Goutham",
      "role": "Executive Member",
      "dept": "Mechanical Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Tech and AI/Koushik_Sai7.jpg",
      "link": "https://www.linkedin.com/in/koushik-sai-goutham-a6b622333"
    },
    {
      "name": "Ashutosh Bhat",
      "role": "Executive Member",
      "dept": "ECE Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Tech and AI/Ashutosh_Bhat.png",
      "link": "https://www.linkedin.com/in/ashb06/"
    },
    {
      "name": "Mrinaal Gupta",
      "role": "Executive Member",
      "dept": "CSE (AI AND DS) Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Tech and AI/Mrinaal.png",
      "link": "https://www.linkedin.com/in/mrinaal-gupta-52240a279"
    },
    {
      "name": "Trupti Aggarwal",
      "role": "Executive Member",
      "dept": "Mathematics & Computing Dept. - 3rd Year",
      "img": "/updated_teams/Trupti.png",
      "link": "https://www.linkedin.com/in/trupti-aggarwal-a91670350/"
    },
    {
      "name": "Anshu Mukhopadhyay",
      "role": "Executive Member",
      "dept": "MME Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Tech and AI/Anshu_Mukhopadhyay.jpg.jpg",
      "link": "https://www.linkedin.com/in/anshu-mukhopadhyay-590455322/"
    },
    {
      "name": "Bhawesh Agrawal",
      "role": "Associate Member",
      "dept": "ECE Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Tech and AI/Bhawesh_Agrawal.jpg",
      "link": "https://www.linkedin.com/in/bhawesh-agrawal/"
    },
    {
      "name": "Akarsh Jaiswal",
      "role": "Associate Member",
      "dept": "CSE Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Tech and AI/Akarsh_Jaiswal.png",
      "link": "https://www.linkedin.com/in/akarsh-jaiswal-aa9413418/?skipRedirect=true"
    },
    {
      "name": "Ayush Dutta",
      "role": "Associate Member",
      "dept": "Chemical Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Tech and AI/Ayush_Dutta.jpg",
      "link": "https://www.linkedin.com/in/ayush-dutta-nitw"
    }
  ],
  "Operations": [
    {
      "name": "Naitik Lunkad",
      "role": "Team Lead",
      "dept": "chemical Dept. - 4th Year",
      "img": "/Innovation Garage Team/Operation/Naitik_Lunkad.jpg",
      "link": "https://www.linkedin.com/in/naitik-lunkad-664937349?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      "name": "Vikalp Saxena",
      "role": "Team Lead",
      "dept": "Biotech Dept. - 4th Year",
      "img": "/updated_teams/Vikalp.png",
      "link": "https://www.linkedin.com/in/vikalp-saxena-751a27206/"
    },
    {
      "name": "Shubhankar Rawat",
      "role": "Executive Member",
      "dept": "BIOTECH Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Operation/Shubhankar_Rawat.png",
      "link": "https://www.linkedin.com/in/shubhankar-rawat-aa754622a/"
    },
    {
      "name": "Vatsal Saini",
      "role": "Executive Member",
      "dept": "MECHANICAL Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Operation/Vatsal_Saini.jpg",
      "link": "https://www.linkedin.com/in/vatsal-saini-b7bb23323?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      "name": "Dhrithi Eshwar Konkati",
      "role": "Executive Member",
      "dept": "Mechanical Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Operation/Dhrithi_Eshwar_Konkati.jpg",
      "link": "https://www.linkedin.com/in/dhrithi-eshwar-konkati-7b7548362/"
    },
    {
      "name": "Sami Hoda",
      "role": "Executive Member",
      "dept": "BIOTECH Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Operation/sami_hoda.jpg",
      "link": "https://www.linkedin.com/in/mohammad-sami-hoda-b010291b4"
    },
    {
      "name": "Parthi Jain",
      "role": "Associate Member",
      "dept": "CSE Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Operation/Parthi_Jain.jpg",
      "link": ""
    },
    {
<<<<<<< HEAD
      "name": "Aryan Jain",
      "role": "Associate Member",
      "dept": "Chemical Dept. - 2nd Year",
=======
      "name": "Aryan Bheema",
      "role": "Associate Member",
      "dept": "MME Dept. - 2nd Year",
>>>>>>> c7891f384d53730a61669411bd062442d9ccd69c
      "img": "/Innovation Garage Team/Operation/Aryan_Jain.jpg",
      "link": "https://www.linkedin.com/in/aryan-jain-67484b309"
    },
    {
      "name": "Segu Bhavyasai Sanjana",
      "role": "Associate Member",
      "dept": "ECE VLSI Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Operation/Segu_Bhavyasai_Sanjana.jpg",
      "link": "https://www.linkedin.com/in/segu-bhavyasai-sanjana"
    },
    {
      "name": "Aryan Bheema",
      "role": "Associate Member",
      "dept": "MME Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Operation/Aryan_Bheema.png",
      "link": "https://www.linkedin.com/in/aryan-bheema-079397349/"
    }
  ],
  "Creative": [
    {
      "name": "Mokshith Srinivas Surutkar",
      "role": "Team Lead",
      "dept": "Mechanical Dept. - 4th Year",
      "img": "/Innovation Garage Team/Creative/Mokshith_Srinivas_Surutkar.jpg",
      "link": "https://www.linkedin.com/in/mokshith-srinivas-surutkar-436322280/"
    },
    {
      "name": "Rayee Venkata Sri Harsha Vardhan",
      "role": "Team Lead",
      "dept": "Ece Dept. - 4th Year",
      "img": "/Innovation Garage Team/Tech and AI/Harsha.png",
      "link": ""
    },
    {
      "name": "Hardik Nishad",
      "role": "Executive Member",
      "dept": "CHEMICAL Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Creative/Hardik_Nishad.jpeg",
      "link": "https://www.linkedin.com/in/hardik-nishad-1b36aa311/"
    },
    {
      "name": "Sriragacharan",
      "role": "Executive Member",
      "dept": "Biotech Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Creative/Ragacharan.jpeg",
      "link": "https://www.linkedin.com/in/sriragacharan-vemuri-9b752b326"
    },
    {
      "name": "Anuj Kishor",
      "role": "Executive Member",
      "dept": "Chemical Dept. - 3rd Year",
      "img": "/Innovation Garage Team/Creative/Anuj.jpeg",
      "link": "https://www.linkedin.com/in/anuj-kishor-4b7502425?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      "name": "Ashutosh Tiwari",
      "role": "Associate Member",
      "dept": "ECE Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Creative/Ashutosh Tiwari_.jpg",
      "link": "https://www.linkedin.com/in/1shu1iwari"
    },
    {
      "name": "D Adithyan",
      "role": "Associate Member",
      "dept": "MECHANICAL Dept. - 2nd Year",
      "img": "/Innovation Garage Team/Creative/D_Adithyan.jpeg",
      "link": "https://www.linkedin.com/in/d-adithyan"
    },
    {
      "name": "Kushagra Anand",
      "role": "Associate Member",
      "dept": "MME Dept. - 2nd Year",
      "img": "/updated_teams/Kushagra.png",
      "link": "https://www.linkedin.com/in/kushagra-anand-b0b840369"
    }
  ]
};

export default function Teams() {
  const [activeTab, setActiveTab] = useState<keyof typeof teamData>("SF & Outreach");

  return (
    <>
      <Navbar />
      <main className="flex-grow relative w-full bg-background-main text-text-main font-pixel min-h-screen overflow-x-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[image:var(--bg-grid-radial)] bg-[size:32px_32px] pointer-events-none opacity-20 fixed"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none fixed"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none fixed"></div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 py-12 lg:py-20 flex flex-col gap-20">
          
          {/* LEADERSHIP SECTION */}
          <section>
            <div className="flex flex-col items-center pt-5 mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-none border border-primary bg-surface-card/80 backdrop-blur-sm shadow-[0_0_10px_rgba(255,106,0,0.2)] mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-sm h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-lg font-bold text-text-main tracking-widest uppercase">Core Command</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-arial font-bold leading-tight tracking-tight text-text-main mb-4 uppercase">
                Leadership
              </h1>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto font-pixel">Guiding the vision and execution of student innovation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {leadershipData.map((leader, idx) => (
                <div key={idx} className="group relative bg-surface-card border-2 border-white/10 p-8 hover:border-primary transition-all duration-300 shadow-none hover:shadow-[8px_8px_0px_0px_rgba(255,106,0,0.5)]">
                  <div className="absolute top-4 right-4 opacity-50">
                  </div>
                  <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="w-32 h-32 overflow-hidden border-2 border-primary shrink-0 bg-background-main">
                      <img 
                        src={leader.img} 
                        alt={leader.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-3xl font-bold text-text-main font-arial mb-2 uppercase">{leader.name}</h3>
                      <div className="inline-block bg-primary/10 px-2 py-0.5 mb-3 border border-primary/20">
                        <p className="text-primary text-lg font-bold uppercase tracking-wide font-pixel">{leader.role}</p>
                      </div>
                      <p className="text-gray-400 text-lg mb-6 leading-tight font-pixel">{leader.dept}</p>
                      {leader.link && (
                        <a className="inline-flex items-center gap-2 text-lg text-cyber-lavender hover:text-primary transition-colors uppercase border-b border-cyber-lavender/30 hover:border-primary pb-0.5 font-pixel" href={leader.link}>
                          <span className="material-symbols-outlined text-xl">link</span>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SQUADRONS SECTION */}
          <section className="w-full">
            <div className="flex flex-col items-center mb-10 text-center">
              <h2 className="text-4xl md:text-6xl font-arial font-bold text-text-main mb-2 uppercase">
                Squadrons
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-white to-primary mb-6"></div>
              <p className="text-gray-400 text-xl font-pixel">Initialize team protocol below</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {Object.keys(teamData).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`cursor-pointer px-8 py-3 border-2 text-xl uppercase tracking-widest transition-all duration-200 select-none font-pixel ${
                    activeTab === tab 
                    ? "bg-secondary text-white border-secondary shadow-neon-hover" 
                    : "bg-surface-card border-white/10 text-gray-400 hover:border-secondary hover:text-secondary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                {teamData[activeTab].map((member, idx) => (
                  <div key={idx} className="bg-surface-card border-2 border-white/5 p-4 flex flex-col items-center text-center hover:border-white/20 transition-all group relative">
                    <div className="absolute top-2 right-2 text-white/10 group-hover:text-white/30">
                    </div>
                    <div className="w-full aspect-square bg-background-main mb-4 overflow-hidden border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-300">
                      <img 
                        src={member.img} 
                        alt={member.name}
                        className="w-full h-full object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h4 className="text-2xl font-bold text-text-main font-arial uppercase tracking-wide">{member.name}</h4>
                    <p className={`text-lg uppercase mb-1 font-bold font-pixel ${
                      member.role === 'Addl. Sec' ? 'text-secondary' : 'text-primary'
                    }`}>
                      {member.role}
                    </p>
                    <p className="text-gray-500 text-lg mb-4 font-pixel">{member.dept}</p>
                    {member.link ? (
                      <a className={`w-full py-2 border border-white/20 text-cyber-lavender hover:text-white transition-all uppercase flex justify-center items-center gap-2 font-pixel ${
                          member.role === 'Addl. Sec' 
                          ? 'hover:bg-secondary hover:border-secondary' 
                          : 'hover:bg-primary hover:border-primary'
                      }`} href={member.link}>
                        <span className="material-symbols-outlined text-lg">link</span> Connect
                      </a>
                    ) : (
                      <span className="w-full py-2 border border-white/5 text-gray-500 uppercase flex justify-center items-center gap-2 font-pixel text-sm select-none">
                        No Profile
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
