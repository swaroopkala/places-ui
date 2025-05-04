// address-search.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
})
export class FormComponent {
  searchForm: FormGroup;
  addressSearchValue: string = '';
  debouncedSearchValue: string = '';

  constructor(private fb: FormBuilder) {
    // Initialize form with empty values
    this.searchForm = this.fb.group({
      addressSearch: [''],
      username: [''],
      country: [''],
      street: [''],
      city: [''],
      state: [''],
      postalCode: [''],
    });
  }

  ngOnInit(): void {
    // Set up debouncing only on the address search field
    this.searchForm
      .get('addressSearch')
      ?.valueChanges.pipe(
        debounceTime(500), // 500ms delay
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.debouncedSearchValue = value;
        console.log('Debounced search value:', this.debouncedSearchValue);
        // Here you would handle API calls or address searching based on debounced value
        // this.searchService.searchAddresses(this.debouncedSearchValue);
      });
  }

  onSubmit(): void {
    console.log('Form submitted with values:', this.searchForm.value);
    // Handle form submission
  }
}
