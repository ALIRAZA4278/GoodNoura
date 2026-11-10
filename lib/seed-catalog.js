// Good Noura catalogue: products, published reviews and shop settings.
// The database (Supabase) is the live copy, edited in /admin. This file is the starting data, kept for reference.
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
   "img": "img/products/good-noura-collection-1-main.jpg",
   "color": "#c9923f",
   "lids": [
    "#e7d3b1",
    "#efe4c8",
    "#b7773d"
   ],
   "price": 5299,
   "onlinePrice": 4769,
   "separate": 6297,
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
   "img": "img/products/peanut-family-pack-1-main.jpg",
   "color": "#b7773d",
   "lids": [
    "#d9a566",
    "#b7773d",
    "#5a3220"
   ],
   "price": 4050,
   "onlinePrice": 3645,
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
   "img": "img/products/almond-cashew-duo-1-main.jpg",
   "color": "#d8bf94",
   "lids": [
    "#e7d3b1",
    "#efe4c8"
   ],
   "price": 3999,
   "onlinePrice": 3599,
   "separate": 4598,
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
   "img": "img/products/creamy-peanut-butter-1-main.jpg",
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
   "inStock": true,
   "gallery": [
    [
     "Main photo",
     "img/products/creamy-peanut-butter-1-main.jpg"
    ],
    [
     "Ingredients & label",
     "img/products/creamy-peanut-butter-2-ingredients.jpg"
    ],
    [
     "Nutrition",
     "img/products/creamy-peanut-butter-3-nutrition.jpg"
    ]
   ],
   "ingredients": "Premium roasted peanuts, sugar, vegetable oil, salt.",
   "allergen": "Contains peanuts.",
   "sizeGallery": {
    "510g": [
     [
      "Main photo",
      "img/products/creamy-peanut-butter-510g-main.jpg"
     ],
     [
      "Ingredients & protein",
      "img/products/creamy-peanut-butter-510g-2-ingredients.jpg"
     ],
     [
      "Nutrition",
      "img/products/creamy-peanut-butter-510g-3-nutrition.jpg"
     ]
    ]
   }
  },
  {
   "id": "crunchy-peanut-butter",
   "type": "singles",
   "name": "Peanut Butter, Crunchy",
   "flavour": "Crunchy",
   "sub": "Real roasted peanut bits.",
   "desc": "All the smoothness, with real roasted peanut pieces in every spoon. For people who like a bit of bite.",
   "img": "img/products/crunchy-peanut-butter-1-main.jpg",
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
   "inStock": true,
   "gallery": [
    [
     "Main photo",
     "img/products/crunchy-peanut-butter-1-main.jpg"
    ],
    [
     "Ingredients & protein",
     "img/products/crunchy-peanut-butter-2-ingredients.jpg"
    ],
    [
     "Nutrition",
     "img/products/crunchy-peanut-butter-3-nutrition.jpg"
    ]
   ],
   "sizeGallery": {
    "510g": [
     [
      "Main photo",
      "img/products/crunchy-peanut-butter-510g-main.jpg"
     ],
     [
      "Ingredients & protein",
      "img/products/crunchy-peanut-butter-510g-2-ingredients.jpg"
     ],
     [
      "Nutrition",
      "img/products/crunchy-peanut-butter-510g-3-nutrition.jpg"
     ]
    ]
   },
   "ingredients": "Premium roasted peanuts, sugar, vegetable oil, salt.",
   "allergen": "Contains peanuts."
  },
  {
   "id": "chocolate-peanut-butter",
   "type": "singles",
   "name": "Peanut Butter, Chocolate",
   "flavour": "Chocolate",
   "sub": "Peanut butter meets cocoa.",
   "desc": "Our peanut butter blended with cocoa. A dessert-worthy spread you can still have at breakfast.",
   "img": "img/products/chocolate-peanut-butter-1-main.jpg",
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
   "inStock": true,
   "gallery": [
    [
     "Main photo",
     "img/products/chocolate-peanut-butter-1-main.jpg"
    ],
    [
     "Ingredients & protein",
     "img/products/chocolate-peanut-butter-2-ingredients.jpg"
    ],
    [
     "Nutrition",
     "img/products/chocolate-peanut-butter-3-nutrition.jpg"
    ]
   ],
   "ingredients": "Premium roasted peanuts, sugar, vegetable oil, cocoa powder, salt.",
   "allergen": "Contains peanuts."
  },
  {
   "id": "almond-butter",
   "type": "singles",
   "name": "Almond Butter",
   "flavour": "Almond",
   "sub": "Pure roasted almonds.",
   "desc": "Roasted almonds ground into a smooth, mild butter. Lovely in smoothies, oats and on fruit.",
   "img": "img/products/almond-butter-1-main.jpg",
   "color": "#e7d3b1",
   "lids": [
    "#e7d3b1"
   ],
   "gallery": [
    [
     "Main photo",
     "img/products/almond-butter-1-main.jpg"
    ],
    [
     "Lifestyle",
     "img/products/almond-butter-2-lifestyle.jpg"
    ],
    [
     "Benefits",
     "img/products/almond-butter-3-benefits.jpg"
    ],
    [
     "Protein & ingredients",
     "img/products/almond-butter-4-ingredients.jpg"
    ],
    [
     "Nutrition",
     "img/products/almond-butter-5-nutrition.jpg"
    ],
    [
     "Label",
     "img/products/almond-butter-6-label.jpg"
    ]
   ],
   "ingredients": "Premium roasted almonds, sugar, vegetable oil, salt.",
   "allergen": "Contains tree nuts (almonds).",
   "sizes": [
    [
     "210g",
     2299
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
   "img": "img/products/cashew-butter-1-main.jpg",
   "color": "#efe4c8",
   "lids": [
    "#efe4c8"
   ],
   "sizes": [
    [
     "210g",
     2299
    ]
   ],
   "inStock": true,
   "gallery": [
    [
     "Main photo",
     "img/products/cashew-butter-1-main.jpg"
    ],
    [
     "Rich & creamy",
     "img/products/cashew-butter-2-spoon.jpg"
    ],
    [
     "Lifestyle",
     "img/products/cashew-butter-3-lifestyle.jpg"
    ],
    [
     "Nutrition",
     "img/products/cashew-butter-4-nutrition.jpg"
    ]
   ]
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
  "shippingFee": 350,
  "freeShipAt": 4000,
  "bankName": "Meezan Bank",
  "accountTitle": "QUALIVANTAGE",
  "accountNumber": "99550116144151",
  "iban": "PK22MEZN0099550116144151",
  "payNote": "Send a screenshot of your payment on WhatsApp with your order number."
 }
}
);
