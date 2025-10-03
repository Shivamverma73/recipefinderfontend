// Replace 'YOUR_API_KEY' with your actual Spoonacular API key
const apiKey = "92091f7ba139473091dc260f296df0ed";
const youtubeApiKey = "AIzaSyD24m2ZOVgbi49xZtgwG8KWs-VsiDLU8mU"; // Replace with your YouTube API key 

function goHome() {
    const recipesContainer = document.getElementById("recipes-container");
    recipesContainer.innerHTML = null;
}

async function findRecipes() {
    const ingredientInput = document.getElementById("ingredient-input").value;
    const recipesContainer = document.getElementById("recipes-container");
    recipesContainer.innerHTML = ""; // Clear previous results

    if (!ingredientInput) {
        alert("Please enter at least one ingredient.");
        return;
    }

    // Spoonacular API endpoint for finding recipes by ingredients
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientInput}&number=5&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length === 0) {
            recipesContainer.innerHTML = "<p>No recipes found.</p>";
            return;
        }

        data.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.className = "recipe-card";

            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
            `;

            // Add a click event to fetch detailed recipe information
            recipeCard.addEventListener("click", () => fetchRecipeDetails(recipe.id));

            recipesContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        recipesContainer.innerHTML = "<p>Something went wrong. Please try again later.</p>";
    }
}

async function fetchRecipeDetails(recipeId) {
    const recipesContainer = document.getElementById("recipes-container");
    recipesContainer.innerHTML = "<p>Loading recipe details...</p>";

    // Spoonacular API to get detailed recipe information
    const spoonacularUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;

    try {
        const response = await fetch(spoonacularUrl);
        const recipeData = await response.json();

        // Extract the recipe title or ingredients for Nutritionix
        const recipeTitle = recipeData.title;
        const ingredients = recipeData.extendedIngredients.map(ing => ing.original);

        // Fetch nutritional data from Nutritionix API
        const nutritionixUrl = `https://trackapi.nutritionix.com/v2/natural/nutrients`;
        const nutritionixResponse = await fetch(nutritionixUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-id": "095d5b1e", // Replace with your actual Nutritionix App ID
                "x-app-key": "0670af63d9ea49fb8a42cac321e4caed" // Replace with your actual Nutritionix API Key
            },
            body: JSON.stringify({ query: ingredients.join(", ") })
        });

        const nutritionData = await nutritionixResponse.json();

        // Fetch a related YouTube video using the recipe title
        const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${recipeData.title}+recipe&key=${youtubeApiKey}`;

        const youtubeResponse = await fetch(youtubeUrl);
        const youtubeData = await youtubeResponse.json();

        const videoId = youtubeData.items.length > 0 ? youtubeData.items[0].id.videoId : null;
        const videoEmbedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

        // Display the recipe details
        recipesContainer.innerHTML = `
            <div class="recipe-detail">
                <h2>${recipeData.title}</h2>
                <img src="${recipeData.image}" alt="${recipeData.title}">
                <h3>Ingredients:</h3>
                <ul>
                    ${recipeData.extendedIngredients.map(ingredient => `<li>${ingredient.original}</li>`).join('')}
                </ul>
                <h3>Instructions:</h3>
                <p>${recipeData.instructions || "No instructions available."}</p>

                <h3>Nutritional Information:</h3>
                <ul>
                    ${nutritionData.foods.map(food => `
                        <li>${food.food_name}: ${food.nf_calories} calories, ${food.nf_protein}g protein</li>
                    `).join('')}
                </ul>

                ${videoEmbedUrl ? `
                    <h3>Watch the Recipe Video:</h3>
                    <iframe width="560" height="315" src="${videoEmbedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                ` : "<p>No related video found.</p>"}

                <button onclick="findRecipes()">Go Back</button>
            </div>
        `;
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        recipesContainer.innerHTML = "<p>Unable to load recipe details. Please try again.</p>";
    }
}
