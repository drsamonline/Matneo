fetch("../data/products.json")
.then(response => response.json())
.then(products => {

    const container = document.getElementById("product-list");

    products.forEach(product => {

        container.innerHTML += `
            <div class="category-card">
                <h3>${product.title}</h3>

                <p>${product.category}</p>

                <strong>${product.price}</strong>

                <br><br>

                <a class="btn" href="${product.link}">
                    View Product
                </a>

            </div>
        `;

    });

});