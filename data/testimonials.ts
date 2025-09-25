export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Arianit Sylafeta",
    role: "Founder",
    content: "Wore a fit Reoutfit built for a wedding — so many compliments. Saved me hours of scrolling.",
    rating: 5,
    avatar: "/testimonials/ari.jpeg"
  },
  {
    id: 2,
    name: "Poema Rogova",
    role: "Instagram Influencer",
    content: "Buyers remorseee no moree. I actually wear everything I buy now.",
    rating: 5,
    avatar: "/testimonials/poi.jpg"
  },
  {
    id: 3,
    name: "Andi Efendija",
    role: "Hotel Manager",
    content: "Who knew you're supposed to wear colors that match with your skintone? Mila",
    rating: 5,
    avatar: "/testimonials/andi.jpeg"
  },
  {
    id: 4,
    name: "Lobsang Lama",
    role: "Founder",
    content: "I need all the brands here. Reoutfit needs to be big.",
    rating: 5,
    avatar: "/testimonials/lobsang.png"
  },
  {
    id: 5,
    name: "Enzo Mucaj",
    role: "Photographer",
    content: "It paired stuff I already own with a new jacket. Nice and easy",
    rating: 5,
    avatar: "/testimonials/enxo.jpeg"
  },
  {
    id: 6,
    name: "Egzon Kabashi",
    role: "Pool Barista",
    content: "Open the app, pick from 3 outfits that feel like me. Out the door in 2 minutes.",
    rating: 5,
    avatar: "/testimonials/egzoni.png"
  }
];
