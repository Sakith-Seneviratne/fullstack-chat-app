    // tailwind.config.js
    /** @type {import('tailwindcss').Config} */
    export default {
      content: ["./index.html", "./src/**/*.{js,jsx}"],
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            // Define your custom colors here
            primary: {
              100: '#f0f4f8',
              // ... other shades
              600: '#2d3748', // Example dark primary shade
              900: '#1a202c', // Example even darker primary shade
            },
            // You can also add single colors
            'deep-black': '#000000',
          },
        },
      },
      plugins: [],
    };