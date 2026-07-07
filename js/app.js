console.log("MATNEO Loaded");

fetch("data/products.json")
.then(response => response.json())
.then(products => {

    const container = document.getElementById("featured-products");

    products.forEach(product => {

        container.innerHTML += `
            <div class="category-card">
                <h3>${product.title}</h3>
                <p>${product.category}</p>
                <strong>${product.price}</strong><br><br>

                <a href="${product.link}" class="btn">
                    View Product
                </a>
            </div>
        `;

    });

});