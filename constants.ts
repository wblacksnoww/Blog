import { BlogPost } from './types';

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Rise of Minimalist Design',
    excerpt: 'Why less is more in the modern web development landscape, and how you can implement it in your next project.',
    content: `
# The Philosophy of Less

In a world cluttered with information, minimalism isn't just a design aesthetic; it's a necessary tool for clarity. 
When we strip away the non-essential, we allow the content to breathe and the user to focus on what truly matters.

## White Space is Not Empty Space

Many developers fear white space. They see it as wasted screen real estate. 
However, proficient designers understand that white space is an active element. It guides the eye, creates rhythm, and reduces cognitive load.

### Key Principles
- **Clarity:** Every element must have a purpose.
- **Hierarchy:** Use typography and spacing to denote importance, not just size.
- **Consistency:** Establish a predictable pattern for interaction.

## Conclusion

Embracing minimalism requires discipline. It is easy to add; it is hard to subtract. But the result is always worth the effort.
    `,
    author: {
      name: 'Sarah Jenkins',
      avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
    },
    coverImageUrl: 'https://picsum.photos/seed/minimal/1200/800',
    publishedAt: '2023-10-15T09:00:00Z',
    readTimeMinutes: 5,
    tags: ['Design', 'Minimalism', 'Web'],
    categories: ['Design', 'UX'],
  },
  {
    id: '2',
    title: 'Understanding React Server Components',
    excerpt: 'A deep dive into the architecture that is changing how we build React applications for performance.',
    content: `
# A New Paradigm

React Server Components (RSC) represent one of the most significant shifts in the React ecosystem. By allowing components to render exclusively on the server, we can reduce bundle sizes and improve initial load times dramatically.

## How it Works

Traditionally, React components render on the client (CSR) or are pre-rendered to HTML (SSR) and then hydrated. RSCs allow you to keep the component logic on the server, sending only the output to the client.

### Benefits
1. **Zero Bundle Size:** Server component code is never downloaded by the client.
2. **Direct Database Access:** You can query your DB directly inside your component.
3. **Automatic Code Splitting:** The framework handles splitting automatically.

> "RSC is not just a feature; it's a reimagining of the component model."

## Final Thoughts

While the learning curve exists, the performance benefits for content-heavy applications are undeniable.
    `,
    author: {
      name: 'David Chen',
      avatarUrl: 'https://picsum.photos/seed/david/100/100',
    },
    coverImageUrl: 'https://picsum.photos/seed/react/1200/800',
    publishedAt: '2023-11-02T14:30:00Z',
    readTimeMinutes: 8,
    tags: ['React', 'Performance', 'Engineering'],
    categories: ['Technology', 'Development'],
  },
   {
    id: '3',
    title: 'Sustainable Living in Urban Environments',
    excerpt: 'Practical tips for reducing your carbon footprint while living in a bustling city apartment.',
    content: `
# Green City Living

Living in a city often means limited space and limited control over your environment. However, sustainability is still achievable.

## Small Changes, Big Impact

You don't need a backyard garden to be sustainable. Balcony composting, reducing single-use plastics, and supporting local farmers' markets are powerful steps.

### Tips for Apartment Dwellers
- **Energy:** Switch to LED bulbs and use smart strips.
- **Food:** Buy local and seasonal produce.
- **Transport:** Utilize public transit or cycle whenever possible.

It is about making conscious choices every day.
    `,
    author: {
      name: 'Elena Rodriguez',
      avatarUrl: 'https://picsum.photos/seed/elena/100/100',
    },
    coverImageUrl: 'https://picsum.photos/seed/city/1200/800',
    publishedAt: '2023-11-20T10:15:00Z',
    readTimeMinutes: 4,
    tags: ['Lifestyle', 'Sustainability', 'City'],
    categories: ['Lifestyle'],
  },
];

export const CURRENT_USER = {
  name: "Guest Writer",
  avatarUrl: "https://picsum.photos/seed/user/100/100"
};