package com.homely.api.billing.dto;

public class CreatePaymentRequest {
    private String planCode;
    private String billing; // monthly | yearly

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(String planCode, String billing) {
        this.planCode = planCode;
        this.billing = billing;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getBilling() {
        return billing;
    }

    public void setBilling(String billing) {
        this.billing = billing;
    }
}
