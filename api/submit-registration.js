import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const formData = await parseFormData(req);
    
    // Generate registration ID
    const registrationId = `NRYLI2025-${Date.now().toString().slice(-8)}`;

    // Handle file upload if present
    let paymentProofUrl = null;
    if (formData.paymentProof) {
      const file = formData.paymentProof;
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' });
      }

      const fileName = `payment-proofs/${registrationId}-${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('registration-files')
        .upload(fileName, file.buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload payment proof' });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('registration-files')
        .getPublicUrl(fileName);
      
      paymentProofUrl = publicUrl;
    }

    // Validate required fields
    const requiredFields = [
      'delegateType', 'surname', 'firstName', 'institution', 
      'institutionAddress', 'institutionContact', 'institutionEmail',
      'regionCluster', 'delegateContact', 'delegateEmail', 
      'age', 'tshirtSize', 'paymentOption'
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate age range
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 15 || age > 35) {
      return res.status(400).json({ error: 'Age must be between 15 and 35' });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.institutionEmail)) {
      return res.status(400).json({ error: 'Invalid institution email format' });
    }
    if (!emailRegex.test(formData.delegateEmail)) {
      return res.status(400).json({ error: 'Invalid delegate email format' });
    }

    // Insert into database
    const { data, error } = await supabase
      .from('registrations')
      .insert([
        {
          registration_id: registrationId,
          delegate_type: formData.delegateType.trim(),
          surname: formData.surname.trim(),
          first_name: formData.firstName.trim(),
          middle_initial: formData.middleInitial ? formData.middleInitial.trim() : null,
          institution: formData.institution.trim(),
          institution_address: formData.institutionAddress.trim(),
          institution_contact: formData.institutionContact.trim(),
          institution_email: formData.institutionEmail.trim().toLowerCase(),
          region_cluster: formData.regionCluster.trim(),
          delegate_contact: formData.delegateContact.trim(),
          delegate_email: formData.delegateEmail.trim().toLowerCase(),
          age: age,
          tshirt_size: formData.tshirtSize.trim(),
          dietary_preferences: formData.dietaryPreferences ? formData.dietaryPreferences.trim() : 'None',
          dietary_comments: formData.dietaryComments ? formData.dietaryComments.trim() : null,
          payment_option: formData.paymentOption.trim(),
          payment_proof_url: paymentProofUrl,
          transaction_ref: formData.transactionRef ? formData.transactionRef.trim() : null,
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save registration' });
    }

    // Send success response
    res.status(200).json({
      success: true,
      registrationId: registrationId,
      message: 'Registration submitted successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to parse multipart form data
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      reject(new Error('No boundary found'));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString('binary');
    });

    req.on('end', () => {
      try {
        const parts = body.split(`--${boundary}`);
        const formData = {};

        parts.forEach(part => {
          if (part.includes('Content-Disposition')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            if (nameMatch) {
              const fieldName = nameMatch[1];
              
              if (part.includes('filename=')) {
                // This is a file
                const filenameMatch = part.match(/filename="([^"]+)"/);
                const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
                
                if (filenameMatch && filenameMatch[1]) {
                  const filename = filenameMatch[1];
                  const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
                  
                  // Extract file content (everything after the double CRLF)
                  const fileContentStart = part.indexOf('\r\n\r\n') + 4;
                  const fileContent = part.substring(fileContentStart);
                  
                  // Convert binary string to buffer
                  const buffer = Buffer.from(fileContent, 'binary');
                  
                  formData[fieldName] = {
                    name: filename,
                    type: contentType,
                    size: buffer.length,
                    buffer: buffer
                  };
                }
              } else {
                // This is a regular field
                const valueStart = part.indexOf('\r\n\r\n') + 4;
                const value = part.substring(valueStart).replace(/\r\n$/, '');
                formData[fieldName] = value;
              }
            }
          }
        });

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}