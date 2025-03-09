// FashionNest - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');
  
  // Initialize Bootstrap tooltips
  initTooltips();
  
  // Initialize Bootstrap dropdowns
  initDropdowns();
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

// Test function to verify JavaScript is working
function testJavaScript() {
  console.log('JavaScript is working!');
  alert('JavaScript is working!');
  return true;
} 