fetch("../data/products.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return response.json();
  })
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

  })
  .catch(error => {
    console.error(error);

    document.getElementById("product-list").innerHTML =
      "<p><strong>Error:</strong> " + error.message + "</p>";
  });