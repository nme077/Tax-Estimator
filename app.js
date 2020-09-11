const federalTaxRates = {
    single: {
      9700: .1,
      39475: .12,
      84200: .22,
      160725: .24,
      204100: .32,
      510300: .35,
      9000000000: .37
    },
    HOH: {
      13850: .1,
      52850: .12,
      84200: .22,
      160700: .24,
      204100: .32,
      510300: .35,
      9000000000: .37
    },
    MFJ: {
      19400: .1,
      78950: .12,
      168400: .22,
      321450: .24,
      408200: .32,
      612350: .35,
      9000000000: .37
    },
    MFS: {
      9700: .1,
      39475: .12,
      84200: .22,
      160725: .24,
      204100: .32,
      306175: .35,
      9000000000: .37
    }
  };
  
  const standardDeductionAmts = {
    single: 12400,
    MFJ: 24800,
    MFS: 12400,
    HOH: 18650
  };
  
  // Initialize variables
  let annualIncome, 
      ytdFederalTax = $('#ytdFederalTax').val(), 
      stdOrItem = $('#stdOrItem').val(), 
      credits = $('#credits').val(), 
      remainingTax;
  
  let filingStatus = $('#filingStatus :selected').val();
  let taxBrackets = federalTaxRates[filingStatus];
  
  // Update variables on change
  $('#filingStatus').change(function(e) {
    filingStatus = $('#filingStatus :selected').val();
    taxBrackets = federalTaxRates[filingStatus];
  });
  
  $('#annualIncome').change(function(e) {
    annualIncome = $('#annualIncome').val();
  });
  
  $('#ytdFederalTax').change(function(e) {
    ytdFederalTax = $('#ytdFederalTax').val();
  });
  
  $('#stdOrItem').change(function(e) {
    stdOrItem = $('#stdOrItem').val();
  });
  
  $('#credits').change(function(e) {
    credits = $('#credits').val() * 1;
  });
  
  $('#stdOrItem').on('change', (e) => {
    const selectedItemized = stdOrItem === 'Itemized deductions';
    const inputHtml = `
      <div class="form-group">
        <input type="number" class="form-control" id="itemizedAmt" placeholder="Total itemized deductions" name="itemizedAmt">
      </div>
    `;
    
    if(selectedItemized) {
      $('#itemizedAmt').remove();
      $('#stdOrItemForm').after(inputHtml);
    } else {
      $('#itemizedAmt').remove();
    }
  });
  
  
  // Handle submit button
  $('#calculateBtn').on('click', (e) => {
    let totalTax = getTotalTax();
    getRemainingTax(totalTax);
    e.preventDefault();

    // Pre-filled email content
    const subject = 'Tax Withholding Estimate';
    const body = `Hello, %0D%0A %0D%0A
        Your estimated total tax liability for 2020 is $${numberWithCommas(totalTax)}. Your remaining estimated tax liability is $${numberWithCommas(remainingTax) || 0}.
    `;
    
    // Remove and add html
    $('#results-display').remove();
    $('.container').append(`
        <div class="m-4" id="results-display">
        <div id="grossIncome">Annual gross income <span class="float-right">$${numberWithCommas(annualIncome || 0)}</span></div>
        <div id="deductions">Total deductions claimed <span class="float-right">${numberWithCommas(calcDeduction(stdOrItem))}</span></div>
        <div id="taxableIncome" class="border-top border-dark">Taxable income <span class="float-right">${numberWithCommas(annualIncome - calcDeduction(stdOrItem) || 0)}</span></div>
        <div id="totalTax" class="border-top border-dark">Total tax <span class="float-right">${numberWithCommas(totalTax)}</span></div>
        <div id="estimatedCredits">Estimated credits <span class="float-right">${numberWithCommas(credits) || 0}</div>
        <div id="ytdFederalTax">Tax withheld to date: <span  class="float-right">${numberWithCommas(ytdFederalTax || 0)}</span>
        </div>
        <div id="remainingTax" class="border-top border-dark"><strong>Remaining tax to withhold: <span class="float-right">$${numberWithCommas(remainingTax || 0)}</span></strong></div>
        <a class="btn btn-success btn-block mt-3" href="mailto:?subject=${subject}&body=${body}" id="email-btn">Email results</a>
        </div>
    `);

  });
  
  
  // Get applicable tax bracket
  function determineTaxBracket() {
    let taxRate;
    
    for (const [maxIncome, rate] of Object.entries(taxBrackets)) {
      if(annualIncome <= maxIncome) {
        taxRate = rate;
        return taxRate;
      }
    }
  };
  
  // Calculate deductions
  function calcDeduction(choice) {
    if(choice === 'Itemized deductions') {
      return $('#itemizedAmt').val();
    } else {
      return standardDeductionAmts[filingStatus];
    }
  };
  
  // Calculate Total estimated federal tax based on annual income and filing status
  function calculateTotalTax(annualIncome) {
    const deduction = calcDeduction(stdOrItem);
    
    const taxableIncome = annualIncome - deduction;
    
    let taxBracket = determineTaxBracket(taxableIncome);
    let applicableTaxBrackets = [];
    let totalTax = 0;
    let prevIncome = 0;
    
    // Create an array of the tax brackets that will be used to calculate tax
    for (const [maxIncome, rate] of Object.entries(taxBrackets)) {
      if(rate <= taxBracket) {
        if(maxIncome*1 < taxableIncome) {
          applicableTaxBrackets.push({maxIncome: maxIncome - prevIncome, rate});
          prevIncome = maxIncome;
        } else {
          applicableTaxBrackets.push({maxIncome: taxableIncome * 1 - prevIncome, rate});
        }
      }
    };
    
    for(const bracket of applicableTaxBrackets) {
      totalTax += bracket.maxIncome * bracket.rate;
    }
    
    totalTax > 0 ? totalTax : totalTax = 0
    
    return totalTax;
  };
  
  // Get total tax estimate
  function getTotalTax() {  
    const totalTax = calculateTotalTax(annualIncome);
    
    return totalTax;
  };
  
  // Get remaining tax
  function getRemainingTax(totalTax) {
    return remainingTax = totalTax - ytdFederalTax - credits;
  };
  
  // Add commas to numbers
  function numberWithCommas(num) {
      return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }