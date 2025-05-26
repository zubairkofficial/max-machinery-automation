# Apollo.io Integration for MachineryMax

This document explains how to use the Apollo.io integration to capture leads based on adjustable parameters, specifically targeting business owners with surplus industrial machinery.

## Overview

The Apollo.io integration allows you to:

1. Fetch leads from Apollo.io based on configurable search parameters
2. Save leads directly to your database
3. Set up automatic daily lead capture targeting machinery owners
4. Manually trigger lead capture
5. Track machinery-specific information for each lead

## Configuration

### Setting up your Apollo.io API Key

Before using the integration, you need to set up your Apollo.io API key:

1. Get an API key from your Apollo.io account dashboard
2. Add this key to your environment variables in the `.env` file:
   ```
   APOLLO_API_KEY=your-apollo-api-key
   ```
3. Alternatively, set the API key via the API:
   ```
   PATCH /apollo/api-key
   {
     "apiKey": "your-apollo-api-key"
   }
   ```

## Usage

### Check API Status

To check if the Apollo.io API is configured:

```
GET /apollo/status
```

### Get Current Search Parameters

To view the current search parameters for automatic lead capture:

```
GET /apollo/config
```

### Update Search Parameters

To update the search parameters for automatic lead capture:

```
POST /apollo/config
{
  "jobTitles": ["CEO", "Owner", "Plant Manager"],
  "industries": ["Manufacturing", "Industrial Equipment"],
  "locations": ["United States", "Canada"],
  "companySize": "51-200",
  "keywords": "industrial machinery equipment",
  "limit": 50
}
```

### Manually Trigger Lead Capture

To immediately trigger lead capture with the current search parameters:

```
POST /apollo/sync/now
```

### Search and Save Leads Directly

To search for leads with custom parameters and save them to your database:

```
POST /leads/apollo/search
{
  "jobTitles": ["Operations Manager", "Facilities Manager"],
  "industries": ["Manufacturing", "Heavy Industry"],
  "locations": ["New York", "Texas"],
  "limit": 30
}
```

### Fetch Machinery-Focused Leads

To specifically target business owners with industrial machinery:

```
POST /leads/apollo/machinery-owners
{
  "locations": ["Chicago", "Detroit"],
  "limit": 20
}
```

### Quick Lead Generation

For simplified lead generation with preset industry focuses:

```
POST /leads/generate
{
  "type": "machinery",
  "count": 30,
  "location": "Texas",
  "industry": "Manufacturing",
  "jobTitle": "Plant Manager"
}
```

The `type` parameter supports different industry presets:
- `machinery` - Targets industrial machinery owners and managers
- `construction` - Targets construction equipment owners
- `automotive` - Targets automotive equipment and machinery
- Any other value will use general manufacturing defaults

All parameters are optional with sensible defaults applied.

## Accessing Leads

### Get All Leads

```
GET /leads?page=1&limit=20
```

### Get Priority Leads

Get leads most likely to have surplus machinery (business owners in manufacturing):

```
GET /leads/priority?page=1&limit=20
```

### Get Confirmed Surplus Machinery Leads

Get leads that have been confirmed to have surplus machinery:

```
GET /leads/surplus-machinery?page=1&limit=20
```

## Updating Lead Information

After calling a lead and confirming they have surplus machinery, update their information:

```
PATCH /leads/:id/machinery-info
{
  "hasSurplusMachinery": true,
  "machineryInterest": "Selling",
  "machineryNotes": "Has 3 CNC machines, looking to sell in next 3 months",
  "machineryDetails": {
    "types": ["CNC Machine", "Lathe"],
    "brands": ["Haas", "DMG Mori"],
    "condition": "Used - Good",
    "age": "5-10 years",
    "estimatedValue": 75000
  }
}
```

## Available Search Parameters

The following parameters can be adjusted for lead searches:

| Parameter | Type | Description |
|-----------|------|-------------|
| jobTitles | array of strings | Job titles to target |
| industries | array of strings | Industries to target |
| locations | array of strings | Locations to target |
| companySize | string | Company size ranges (e.g., "51-200") |
| keywords | string | Keywords to search for |
| companyNames | array of strings | Specific companies to target |
| emailStatus | string | Status of email (e.g., "verified") |
| limit | number | Maximum number of leads to fetch |
| page | number | Page number for pagination |

## Automatic Scheduling

The system is configured to automatically fetch new machinery-focused leads every day at midnight.
This schedule can be modified in the `apollo-scheduler.service.ts` file. 