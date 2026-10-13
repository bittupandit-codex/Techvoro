const bracelets = window.TECHVORO_PRODUCTS || [];
const cartStorageKey = "techvoroBraceletCart";

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  updateCartCount();
  bindProductEvents();
  bindDialogEvents();
  window.addEventListener("storage", handleStorageChange);
});

function formatPrice(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function renderProducts() {
  const productGrids = document.querySelectorAll("[data-product-grid]");
  productGrids.forEach((grid) => {
    grid.innerHTML = bracelets.map((product) => {
      const originalPrice = product.originalPrice
        ? `<span class="product-original-price">${formatPrice(product.originalPrice)}</span>`
        : "";

      return `
        <article class="product-card">
          <img
            class="product-image"
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          />
          <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-price-row">
              <span class="product-price">${formatPrice(product.price)}</span>
              ${originalPrice}
            </div>
            <div class="product-actions">
              <button
                class="button button-secondary"
                type="button"
                data-view-details="${product.id}"
              >View Details</button>
              <button
                class="button button-primary"
                type="button"
                data-add-to-cart="${product.id}"
              >Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  });
}

function bindProductEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.addToCart) {
      changeQuantity(button.dataset.addToCart, 1);
    }

    if (button.dataset.viewDetails) {
      showProductDetails(button.dataset.viewDetails);
    }

    if (button.dataset.cartAction) {
      const { cartAction, productId } = button.dataset;
      if (cartAction === "increase") changeQuantity(productId, 1);
      if (cartAction === "decrease") changeQuantity(productId, -1);
      if (cartAction === "remove") removeProduct(productId);
    }
  });
}

function bindDialogEvents() {
  const dialog = document.querySelector("[data-details-dialog]");
  const closeButton = document.querySelector("[data-dialog-close]");
  if (!dialog || !closeButton) return;

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function showProductDetails(productId) {
  const product = bracelets.find((item) => item.id === productId);
  const dialog = document.querySelector("[data-details-dialog]");
  if (!product || !dialog) return;

  dialog.querySelector("[data-dialog-title]").textContent = product.name;
  dialog.querySelector("[data-dialog-description]").textContent = product.description;
  dialog.querySelector("[data-dialog-price]").textContent = formatPrice(product.price);

  const image = dialog.querySelector("[data-dialog-image]");
  image.src = product.image;
  image.alt = product.name;
  dialog.showModal();
}

function readCart() {
  try {
    const value = localStorage.getItem(cartStorageKey);
    if (!value) return [];

    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("Cart data is not a list.");

    return parsed.filter((entry) => {
      return (
        entry &&
        bracelets.some((product) => product.id === entry.id) &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0
      );
    });
  } catch (error) {
    showCartMessage("Your saved cart could not be read. Please clear browser storage and try again.");
    console.error("Unable to read the saved cart.", error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    clearCartMessage();
    renderCart();
    updateCartCount();
  } catch (error) {
    showCartMessage("Your cart could not be saved. Check that browser storage is available.");
    console.error("Unable to save the cart.", error);
  }
}

function changeQuantity(productId, change) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += change;
    if (existing.quantity <= 0) {
      saveCart(cart.filter((item) => item.id !== productId));
      return;
    }
  } else if (change > 0 && bracelets.some((item) => item.id === productId)) {
    cart.push({ id: productId, quantity: change });
  } else {
    return;
  }

  saveCart(cart);
}

function removeProduct(productId) {
  saveCart(readCart().filter((item) => item.id !== productId));
}

function renderCart() {
  const container = document.querySelector("[data-cart-items]");
  const emptyMessage = document.querySelector("[data-empty-cart]");
  const totalElement = document.querySelector("[data-cart-total]");
  if (!container || !emptyMessage || !totalElement) return;

  const cart = readCart();
  const total = cart.reduce((sum, item) => {
    const product = bracelets.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  totalElement.textContent = formatPrice(total);
  emptyMessage.hidden = cart.length > 0;
  container.innerHTML = cart.map((item) => {
    const product = bracelets.find((entry) => entry.id === item.id);
    if (!product) return "";

    return `
      <article class="cart-item">
        <img src="${product.image}" alt="" loading="lazy" />
        <div>
          <h3 class="cart-item-name">${product.name}</h3>
          <span class="cart-item-price">${formatPrice(product.price)} each</span>
        </div>
        <div class="quantity-controls" aria-label="Quantity for ${product.name}">
          <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${item.quantity}</span>
          <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Increase quantity">+</button>
        </div>
        <button
          class="remove-item"
          type="button"
          data-cart-action="remove"
          data-product-id="${product.id}"
        >Remove</button>
      </article>
    `;
  }).join("");
}

function updateCartCount() {
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = String(count);
  });
  document.querySelectorAll(".cart-link").forEach((link) => {
    link.setAttribute("aria-label", `Cart, ${count} ${count === 1 ? "item" : "items"}`);
  });
}

function showCartMessage(message) {
  const element = document.querySelector("[data-cart-message]");
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function clearCartMessage() {
  const element = document.querySelector("[data-cart-message]");
  if (!element) return;
  element.textContent = "";
  element.hidden = true;
}

function handleStorageChange(event) {
  if (event.key === cartStorageKey) {
    renderCart();
    updateCartCount();
  }
}
