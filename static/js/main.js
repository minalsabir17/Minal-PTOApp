// Main JavaScript for PTO Tracker

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle partial day checkbox
    const partialDayCheckbox = document.getElementById('is_partial_day');
    const timeInputs = document.getElementById('time_inputs');
    
    if (partialDayCheckbox && timeInputs) {
        partialDayCheckbox.addEventListener('change', function() {
            if (this.checked) {
                timeInputs.style.display = 'block';
                document.getElementById('start_time').required = true;
                document.getElementById('end_time').required = true;
            } else {
                timeInputs.style.display = 'none';
                document.getElementById('start_time').required = false;
                document.getElementById('end_time').required = false;
            }
        });
    }

    // Populate team member dropdown based on team selection
    const teamSelect = document.getElementById('team');
    const positionSelect = document.getElementById('position');
    const nameSelect = document.getElementById('name');
    const emailInput = document.getElementById('email');

    if (teamSelect && positionSelect && nameSelect) {
        let staffDirectory = {};

        // Load staff directory from API
        async function loadStaffDirectory() {
            try {
                const response = await fetch('/api/staff-directory');
                if (response.ok) {
                    staffDirectory = await response.json();
                } else {
                    console.error('Failed to load staff directory');
                }
            } catch (error) {
                console.error('Error loading staff directory:', error);
            }
        }

        // Initial load of staff directory
        loadStaffDirectory();

        // Make refresh function available globally
        window.refreshStaffDirectory = async function() {
            await loadStaffDirectory();
            // Also refresh the currently selected team/position dropdowns
            if (teamSelect.value) {
                teamSelect.dispatchEvent(new Event('change'));
            }
        };

        teamSelect.addEventListener('change', async function() {
            const selectedTeam = this.value;
            
            // Clear position dropdown
            positionSelect.innerHTML = '<option value="">Select Position</option>';
            nameSelect.innerHTML = '<option value="">Select Team Member</option><option value="NOT_LISTED" data-custom="true">🔍 I\'m not listed - Register as new employee</option>';
            emailInput.value = '';
            
            // Make sure staff directory is loaded
            if (Object.keys(staffDirectory).length === 0) {
                await loadStaffDirectory();
            }
            
            if (selectedTeam && staffDirectory[selectedTeam]) {
                Object.keys(staffDirectory[selectedTeam]).forEach(position => {
                    const option = document.createElement('option');
                    option.value = position;
                    option.textContent = position;
                    positionSelect.appendChild(option);
                });
            }
        });

        positionSelect.addEventListener('change', async function() {
            const selectedTeam = teamSelect.value;
            const selectedPosition = this.value;
            
            // Clear name dropdown
            nameSelect.innerHTML = '<option value="">Select Team Member</option><option value="NOT_LISTED" data-custom="true">🔍 I\'m not listed - Register as new employee</option>';
            emailInput.value = '';
            
            // Make sure staff directory is loaded
            if (Object.keys(staffDirectory).length === 0) {
                await loadStaffDirectory();
            }
            
            if (selectedTeam && selectedPosition && staffDirectory[selectedTeam] && staffDirectory[selectedTeam][selectedPosition]) {
                staffDirectory[selectedTeam][selectedPosition].forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.name;
                    option.textContent = member.name;
                    option.dataset.email = member.email;
                    nameSelect.appendChild(option);
                });
            }
        });

        nameSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.dataset.email && this.value !== 'NOT_LISTED') {
                emailInput.value = selectedOption.dataset.email;
            } else if (this.value === 'NOT_LISTED') {
                emailInput.value = '';
            }
        });
    }

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert && alert.parentElement) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentElement) {
                        alert.parentElement.removeChild(alert);
                    }
                }, 300);
            }
        }, 5000);
    });

    // Confirmation for approval/denial actions
    const approveButtons = document.querySelectorAll('.btn-approve');
    const denyButtons = document.querySelectorAll('.btn-deny');

    approveButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to approve this request?')) {
                e.preventDefault();
            }
        });
    });

    denyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const reason = prompt('Please provide a reason for denial:');
            if (!reason || reason.trim() === '') {
                e.preventDefault();
                alert('A denial reason is required.');
            } else {
                // Add hidden input with denial reason
                const form = button.closest('form');
                if (form) {
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'denial_reason';
                    hiddenInput.value = reason;
                    form.appendChild(hiddenInput);
                }
            }
        });
    });

    // Date validation - ensure end date is not before start date
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            endDateInput.min = this.value;
            if (endDateInput.value && endDateInput.value < this.value) {
                endDateInput.value = this.value;
            }
        });

        endDateInput.addEventListener('change', function() {
            if (startDateInput.value && this.value < startDateInput.value) {
                alert('End date cannot be before start date.');
                this.value = startDateInput.value;
            }
        });
    }

    // Set minimum date to today for new requests
    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        if (!startDateInput.value) {
            startDateInput.value = today;
        }
    }

    if (endDateInput) {
        const today = new Date().toISOString().split('T')[0];
        endDateInput.min = today;
        if (!endDateInput.value) {
            endDateInput.value = today;
        }
    }
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}