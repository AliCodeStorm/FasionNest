// FashionNest - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');
  
  // Initialize Bootstrap tooltips
  initTooltips();
  
  // Initialize Bootstrap dropdowns
  initDropdowns();
  
  // Initialize search suggestions
  initSearchSuggestions();
  
  // Initialize wishlist buttons
  initWishlistButtons();
  
  // Initialize cart functionality
  initCart();
  
  // Initialize newsletter form
  initNewsletterForm();
});

// Initialize Bootstrap tooltips
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  if (tooltipTriggerList.length > 0) {
    console.log('Initializing tooltips');
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

// Initialize Bootstrap dropdowns
function initDropdowns() {
  const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
  if (dropdownElementList.length > 0) {
    console.log('Initializing dropdowns');
    dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });
  }
}

// Initialize search suggestions
function initSearchSuggestions() {
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  
  if (!searchInput || !searchSuggestions) return;
  
  let debounceTimer;
  
  searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      searchSuggestions.style.display = 'none';
      return;
    }
    
    debounceTimer = setTimeout(() => {
      fetch(`/products/search/suggestions?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          if (data.length === 0) {
            searchSuggestions.style.display = 'none';
            return;
          }
          
          let html = '';
          data.forEach(product => {
            html += `
              <div class="search-suggestion-item" data-url="/products/${product.slug}">
                <img src="${product.images[0]}" alt="${product.name}">
                <div>
                  <div>${product.name}</div>
                  <div class="text-primary">$${product.price.toFixed(2)}</div>
                </div>
              </div>
            `;
          });
          
          searchSuggestions.innerHTML = html;
          searchSuggestions.style.display = 'block';
          
          // Add click event to suggestion items
          document.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
              window.location.href = this.dataset.url;
            });
          });
        })
        .catch(error => {
          console.error('Search suggestion error:', error);
          searchSuggestions.style.display = 'none';
        });
    }, 300);
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.style.display = 'none';
    }
  });
}

// Initialize wishlist buttons
function initWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');
  
  wishlistButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const productId = this.dataset.productId;
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // Remove from wishlist
        fetch(`/user/wishlist/remove/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              this.classList.remove('active');
              this.innerHTML = '<i class="far fa-heart"></i>';
            }
          })
          .catch(error => console.error('Wishlist error:', error));
      } else {
        // Add to wishlist
        fetch(`/user/wishlist/add/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              this.classList.add('active');
              this.innerHTML = '<i class="fas fa-heart"></i>';
            }
          })
          .catch(error => console.error('Wishlist error:', error));
      }
    });
  });
}

// Initialize cart functionality
function initCart() {
  // Add to cart form
  const addToCartForm = document.getElementById('addToCartForm');
  if (addToCartForm) {
    addToCartForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      
      fetch('/cart/add', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success message
            const messageElement = document.getElementById('addToCartMessage');
            if (messageElement) {
              messageElement.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  ${data.message}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              `;
            }
          }
        })
        .catch(error => console.error('Add to cart error:', error));
    });
  }
  
  // Quantity controls in cart
  const quantityControls = document.querySelectorAll('.quantity-control');
  quantityControls.forEach(control => {
    const decreaseBtn = control.querySelector('.decrease-btn');
    const increaseBtn = control.querySelector('.increase-btn');
    const input = control.querySelector('input');
    
    if (decreaseBtn && increaseBtn && input) {
      decreaseBtn.addEventListener('click', function() {
        let value = parseInt(input.value);
        if (value > 1) {
          value--;
          input.value = value;
        }
      });
      
      increaseBtn.addEventListener('click', function() {
        let value = parseInt(input.value);
        value++;
        input.value = value;
      });
    }
  });
}

// Initialize newsletter form
function initNewsletterForm() {
  const newsletterForm = document.getElementById('newsletterForm');
  const homeNewsletterForm = document.getElementById('homeNewsletterForm');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      const messageElement = document.getElementById('newsletterMessage');
      
      fetch('/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            messageElement.innerHTML = `
              <div class="alert alert-success" role="alert">
                ${data.message}
              </div>
            `;
            this.reset();
          } else {
            messageElement.innerHTML = `
              <div class="alert alert-danger" role="alert">
                ${data.message}
              </div>
            `;
          }
        })
        .catch(error => {
          console.error('Newsletter subscription error:', error);
          messageElement.innerHTML = `
            <div class="alert alert-danger" role="alert">
              Something went wrong. Please try again later.
            </div>
          `;
        });
    });
  }
  
  if (homeNewsletterForm) {
    homeNewsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      const messageElement = document.getElementById('homeNewsletterMessage');
      
      fetch('/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            messageElement.innerHTML = `
              <div class="alert alert-success" role="alert">
                ${data.message}
              </div>
            `;
            this.reset();
          } else {
            messageElement.innerHTML = `
              <div class="alert alert-danger" role="alert">
                ${data.message}
              </div>
            `;
          }
        })
        .catch(error => {
          console.error('Newsletter subscription error:', error);
          messageElement.innerHTML = `
            <div class="alert alert-danger" role="alert">
              Something went wrong. Please try again later.
            </div>
          `;
        });
    });
  }
}

// Test function to verify JavaScript is working
function testJavaScript() {
  console.log('JavaScript is working!');
  alert('JavaScript is working!');
  return true;
} 