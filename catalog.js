// Good Noura catalogue: products, published reviews and shop settings.
// While server.js is running, the site gets a live copy of this from the database (edited in /admin).
// This file is the starting data, and the fallback when the pages are opened straight from the folder.
(function (c) { if (typeof module !== "undefined") module.exports = c; else window.GN_CATALOG = window.GN_CATALOG || c; })(
{
 "products": [
  {
   "id": "good-noura-collection",
   "type": "bundles",
   "name": "The Good Noura Collection",
   "featured": true,
   "ribbon": "Most complete",
   "sub": "One of every butter — the full Good Noura experience.",
   "desc": "Almond, cashew and your favourite peanut butter in one box. The easiest way to try everything we make — or to gift it.",
   "img": "https://goodnoura.com/cdn/shop/files/9.png?v=1793342684&width=800",
   "color": "#c9923f",
   "lids": [
    "#e7d3b1",
    "#efe4c8",
    "#b7773d"
   ],
   "price": 6499,
   "onlinePrice": 5849,
   "separate": 7297,
   "items": [
    [
     "Almond Butter",
     "210g"
    ],
    [
     "Cashew Butter",
     "210g"
    ],
    [
     "Peanut Butter (your pick)",
     "510g"
    ]
   ],
   "choice": {
    "label": "Choose your peanut butter",
    "opts": [
     "Creamy",
     "Crunchy",
     "Chocolate"
    ]
   },
   "contains": [
    "almond-butter",
    "cashew-butter",
    "creamy-peanut-butter",
    "crunchy-peanut-butter",
    "chocolate-peanut-butter"
   ],
   "inStock": true
  },
  {
   "id": "peanut-family-pack",
   "type": "bundles",
   "name": "Peanut Family Pack",
   "badge": "Best seller",
   "sub": "All three peanut butters in the big family jar.",
   "desc": "Creamy, crunchy and chocolate — three 510g jars so everyone at home gets their favourite.",
   "img": "https://goodnoura.com/cdn/shop/files/10.png?v=1793342723&width=800",
   "color": "#b7773d",
   "lids": [
    "#d9a566",
    "#b7773d",
    "#5a3220"
   ],
   "price": 4599,
   "onlinePrice": 4139,
   "separate": 5097,
   "items": [
    [
     "Peanut Butter, Creamy",
     "510g"
    ],
    [
     "Peanut Butter, Crunchy",
     "510g"
    ],
    [
     "Peanut Butter, Chocolate",
     "510g"
    ]
   ],
   "contains": [
    "creamy-peanut-butter",
    "crunchy-peanut-butter",
    "chocolate-peanut-butter"
   ],
   "inStock": true
  },
  {
   "id": "almond-cashew-duo",
   "type": "bundles",
   "name": "Almond + Cashew Duo",
   "badge": "Premium",
   "sub": "Our two premium nut butters, side by side.",
   "desc": "Silky almond butter and rich cashew butter. A premium pair for breakfast bowls, smoothies and baking.",
   "img": "https://goodnoura.com/cdn/shop/files/7_2407298a-658f-4847-baa0-c2909dd6fe77.png?v=1793342598&width=800",
   "color": "#d8bf94",
   "lids": [
    "#e7d3b1",
    "#efe4c8"
   ],
   "price": 4999,
   "onlinePrice": 4499,
   "separate": 5598,
   "items": [
    [
     "Almond Butter",
     "210g"
    ],
    [
     "Cashew Butter",
     "210g"
    ]
   ],
   "contains": [
    "almond-butter",
    "cashew-butter"
   ],
   "inStock": true
  },
  {
   "id": "creamy-peanut-butter",
   "type": "singles",
   "name": "Peanut Butter, Creamy",
   "flavour": "Creamy",
   "sub": "Smooth, everyday spread.",
   "desc": "Slow-roasted peanuts ground until silky smooth. Made for toast, parathas, apples and a spoon straight from the jar.",
   "img": "https://goodnoura.com/cdn/shop/files/1_5abb56eb-77a4-4250-9613-587657da051a.png?v=1791733226&width=800",
   "color": "#d9a566",
   "lids": [
    "#d9a566"
   ],
   "sizes": [
    [
     "340g",
     1349
    ],
    [
     "510g",
     1699
    ]
   ],
   "inStock": true
  },
  {
   "id": "crunchy-peanut-butter",
   "type": "singles",
   "name": "Peanut Butter, Crunchy",
   "flavour": "Crunchy",
   "sub": "Real roasted peanut bits.",
   "desc": "All the smoothness, with real roasted peanut pieces in every spoon. For people who like a bit of bite.",
   "img": "https://goodnoura.com/cdn/shop/files/1_4eaec112-bbe3-426d-bda4-8c2e80568356.png?v=1791734896&width=800",
   "color": "#b7773d",
   "lids": [
    "#b7773d"
   ],
   "sizes": [
    [
     "340g",
     1349
    ],
    [
     "510g",
     1699
    ]
   ],
   "inStock": true
  },
  {
   "id": "chocolate-peanut-butter",
   "type": "singles",
   "name": "Peanut Butter, Chocolate",
   "flavour": "Chocolate",
   "sub": "Peanut butter meets cocoa.",
   "desc": "Our peanut butter blended with cocoa. A dessert-worthy spread you can still have at breakfast.",
   "img": "https://goodnoura.com/cdn/shop/files/1_c5d4d60c-ee6d-4963-a580-91d7075cdb87.png?v=1791735330&width=800",
   "color": "#5a3220",
   "lids": [
    "#5a3220"
   ],
   "sizes": [
    [
     "340g",
     1349
    ],
    [
     "510g",
     1699
    ]
   ],
   "inStock": true
  },
  {
   "id": "almond-butter",
   "type": "singles",
   "name": "Almond Butter",
   "flavour": "Almond",
   "sub": "Pure roasted almonds.",
   "desc": "Roasted almonds ground into a smooth, mild butter. Lovely in smoothies, oats and on fruit.",
   "img": "img/almond-1-main.webp",
   "color": "#e7d3b1",
   "lids": [
    "#e7d3b1"
   ],
   "gallery": [
    [
     "Main photo",
     "img/almond-1-main.webp"
    ],
    [
     "Flavour",
     "img/almond-2-flavour.webp"
    ],
    [
     "Benefits",
     "img/almond-3-benefits.png"
    ],
    [
     "How to use",
     "img/almond-4-uses.webp"
    ],
    [
     "Nutrition",
     "img/almond-5-nutrition.png"
    ]
   ],
   "ingredients": "100% roasted almonds. No additives, no preservatives.",
   "allergen": "Contains tree nuts (almonds).",
   "sizes": [
    [
     "210g",
     2799
    ]
   ],
   "inStock": true
  },
  {
   "id": "cashew-butter",
   "type": "singles",
   "name": "Cashew Butter",
   "flavour": "Cashew",
   "sub": "Rich, creamy cashews.",
   "desc": "Naturally sweet and creamy. Spread it, drizzle it, or stir it into curries and desserts.",
   "img": "https://goodnoura.com/cdn/shop/files/1_ee49cee9-47ff-4176-b330-8d4a99a4417b.png?v=1791735966&width=800",
   "color": "#efe4c8",
   "lids": [
    "#efe4c8"
   ],
   "sizes": [
    [
     "210g",
     2799
    ]
   ],
   "inStock": true
  }
 ],
 "reviews": [
  {
   "name": "Ayesha Khan",
   "city": "Lahore",
   "product": "creamy-peanut-butter",
   "text": "The creamy peanut butter is so smooth and delicious. It goes perfectly with my morning toast, and the packaging looks beautiful too!"
  },
  {
   "name": "Hassan Raza",
   "city": "Karachi",
   "product": "crunchy-peanut-butter",
   "text": "Really enjoyed the crunchy peanut butter. Great texture, rich peanut flavor, and something I would happily order again."
  },
  {
   "name": "Zainab Malik",
   "city": "Rawalpindi",
   "product": "chocolate-peanut-butter",
   "text": "A delicious chocolatey treat with my pancakes. I love how indulgent it feels."
  },
  {
   "name": "Bilal Siddiqui",
   "city": "Lahore",
   "product": "almond-butter",
   "text": "The almond butter is lovely on toast and in my breakfast oats. The presentation is beautiful."
  }
 ],
 "settings": {
  "phone": "0339 4888776",
  "whatsapp": "923394888776",
  "email": "Goodnoura6@gmail.com",
  "minJars": 2,
  "bankName": "",
  "accountTitle": "",
  "accountNumber": "",
  "iban": "",
  "payNote": "Send a screenshot of your payment on WhatsApp with your order number."
 }
}
);
