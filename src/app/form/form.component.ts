// address-search.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
})
export class FormComponent {
  searchForm: FormGroup;
  addressSearchValue: string = '';
  debouncedSearchValue: string = '';
  autocompleteResults: any[] = []; // Store autocomplete results
  showDropdown: boolean = false; // Control dropdown visibility
  private apiUrl = environment.apiUrl;
  
  // Error handling properties
  errorMessage: string = '';
  showError: boolean = false;
  errorType: 'warning' | 'error' | 'info' = 'error';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Initialize form with empty values
    this.searchForm = this.fb.group({
      addressSearch: [''],
      username: [''],
      country: [''],
      street: [''],
      city: [''],
      state: [''],
    });
  }

  ngOnInit(): void {
    // Set up debouncing only on the address search field
    this.searchForm
      .get('addressSearch')
      ?.valueChanges.pipe(
        debounceTime(1500), // 1500ms delay
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.debouncedSearchValue = value;
        // Clear any previous errors when user types
        this.hideError();
        
        if (value && value.length > 2) { // Only search if there are at least 3 characters
          this.http
            .get(`${this.apiUrl}/places/autocomplete?query=${value}`)
            .subscribe({
              next: (data: any) => {
                console.log('Autocomplete response:', data);
                this.autocompleteResults = data.predictions || [];
                this.showDropdown = this.autocompleteResults.length > 0;
                
                // If no results found, show a friendly message
                if (this.autocompleteResults.length === 0) {
                  this.showErrorMessage('No results found for your search. Try a different query.', 'info');
                }
              },
              error: (error: HttpErrorResponse) => {
                console.error('Error fetching autocomplete data:', error);
                this.autocompleteResults = [];
                this.showDropdown = false;
                this.handleApiError(error);
              },
            });
        } else {
          this.autocompleteResults = [];
          this.showDropdown = false;
        }
      });
  }

  // Method to handle API errors based on status code
  private handleApiError(error: HttpErrorResponse): void {
    if (error.status === 400) {
      this.showErrorMessage('Please double check your input and try again.', 'warning');
    } else if (error.status === 401 || error.status === 403) {
      this.showErrorMessage('Authentication error. Please log in again.', 'error');
    } else if (error.status === 404) {
      this.showErrorMessage('The requested resource was not found.', 'warning');
    } else if (error.status === 500) {
      this.showErrorMessage('Server error. Please try again later.', 'error');
    } else if (error.status === 0) {
      this.showErrorMessage('Network error. Please check your connection.', 'warning');
    } else {
      this.showErrorMessage(`Error (${error.status}): ${error.message}`, 'error');
    }
  }

  // Show error message banner
  private showErrorMessage(message: string, type: 'warning' | 'error' | 'info' = 'error'): void {
    this.errorMessage = message;
    this.errorType = type;
    this.showError = true;
    
    // Auto-hide non-critical errors after 5 seconds
    if (type !== 'error') {
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }
  
  // Hide error message banner
  hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  // Method to handle selection from dropdown
  selectPlace(place: any): void {
    console.log('Selected place:', place);
    
    // Set the input field value to the selected description
    this.searchForm.get('addressSearch')?.setValue(place.description, { emitEvent: false });
    
    // Extract and map location data from the selected place
    const terms = place.terms || [];
    console.log('Terms array:', terms);
    
    // Ensure we're working with the latest form instance
    setTimeout(() => {
      // Map the values based on the terms array
      if (terms.length > 0) {
        // Find city, state, and country by searching through the terms
        let city = '';
        let state = '';
        let country = '';
        let street = '';
        
        // The last term is typically the country
        if (terms.length > 0) {
          country = terms[terms.length - 1].value;
        }
        
        // The second-to-last term is typically the state/province
        if (terms.length > 1) {
          state = terms[terms.length - 2].value;
        }
        
        // For cities, we need to look for specific city names
        // In your example, "Bengaluru" is the city (at index 4)
        if (terms.length > 2) {
          // Look for city term - usually before state
          // This is a simplified approach - in a real app you might need more sophisticated logic
          city = terms[terms.length - 3].value;
          
          // If there are more terms, combine them for the street
          if (terms.length > 3) {
            const streetTerms = terms.slice(0, terms.length - 3);
            street = streetTerms.map((term: { value: string }) => term.value).join(', ');
          }
        }
        
        console.log('Setting city to:', city);
        console.log('Setting state to:', state);
        console.log('Setting country to:', country);
        console.log('Setting street to:', street);
        
        // Update the form
        this.searchForm.patchValue({
          city: city,
          state: state,
          country: country,
          street: street
        });
        
        // Force change detection
        this.searchForm.updateValueAndValidity();
      }
      
      // Close the dropdown
      this.showDropdown = false;
    });
  }

  // Method to close dropdown when clicking outside
  closeDropdown(): void {
    this.showDropdown = false;
  }

  onSubmit(): void {
    console.log('Form submitted with values:', this.searchForm.value);
    // Handle form submission
  }
}
