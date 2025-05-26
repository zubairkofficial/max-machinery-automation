# MaxMachinery Call History Components

This document describes the components used to display call history information in the MaxMachinery application.

## Components

### CallHistoryList

The `CallHistoryList` component displays a list of calls for a lead, supporting both the old and new data structures.

```tsx
<CallHistoryList
  callHistoryRecords={lead.callHistoryRecords}
  additionalInfoCallHistory={lead.additionalInfo?.callHistory}
  leadName={lead.name}
  leadCompany={lead.company}
/>
```

#### Props
- `callHistoryRecords`: Array of call records in the new format
- `additionalInfoCallHistory`: Array of call records in the old format
- `leadName`: Name of the lead
- `leadCompany`: Company name of the lead

### CallDetailPanel

The `CallDetailPanel` component displays detailed information about a specific call.

```tsx
<CallDetailPanel
  call={{
    ...callRecord,
    leadName: lead.name,
    leadCompany: lead.company,
    isNewFormat: true // Set to true for new format calls
  }}
/>
```

#### Props
- `call`: Call record with additional display information
  - For new format calls, set `isNewFormat: true` to enable fetching additional details
  - Include `leadName` and `leadCompany` for display purposes

## Data Migration

The application supports both old and new call data structures during the migration period:

1. Old Structure:
   - Call data stored in `lead.additionalInfo.callHistory`
   - Basic call information only

2. New Structure:
   - Call data stored in `lead.callHistoryRecords` and `lead.lastCallRecord`
   - Detailed call information with analytics, quality metrics, and sentiment analysis
   - Supports fetching additional call details by ID

## Usage Example

```tsx
import { CallHistoryList } from '../components/CallHistoryList';

const LeadDetailsPage: React.FC<{ lead: Lead }> = ({ lead }) => {
  return (
    <div>
      <h2>Call History</h2>
      <CallHistoryList
        callHistoryRecords={lead.callHistoryRecords}
        additionalInfoCallHistory={lead.additionalInfo?.callHistory}
        leadName={lead.name}
        leadCompany={lead.company}
      />
    </div>
  );
};
```

## API Endpoints

The following endpoints are available for call data:

1. `GET /calls/:callId`
   - Fetches detailed information about a specific call

2. `GET /leads/:leadId/calls`
   - Fetches all calls for a specific lead

3. `GET /leads/:leadId/last-call`
   - Fetches the most recent call for a lead

## Types

The application uses TypeScript interfaces to define the call data structure:

```typescript
interface CallHistory {
  id: string;
  callId: string;
  callType: string;
  agentId: string;
  status: string;
  startTimestamp: number;
  endTimestamp?: number;
  fromNumber: string;
  toNumber: string;
  direction: string;
  // ... additional fields for call quality, analytics, etc.
}
```

For more details about the data structure, see `src/types/call-history.ts`. 