# Perintah setup GCP (DAFTAR, belum dijalankan)

Semua perintah di bawah membuat sumber daya cloud dan berpotensi berbiaya. Jalankan hanya
setelah persetujuan project ID, billing, dan region (Lampiran D). Ganti placeholder.

```bash
# Service account backend dengan hak akses minimum
gcloud iam service-accounts create placetogo-api-sa --project PROJECT_ID
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member serviceAccount:placetogo-api-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role roles/datastore.user
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member serviceAccount:placetogo-api-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role roles/firebaseauth.viewer   # verifikasi token; sesuaikan bila perlu

# Secret Manager: beri akses per secret, bukan per project
printf '%s' "$VALUE" | gcloud secrets create maps-server-api-key --data-file=- --project PROJECT_ID
gcloud secrets add-iam-policy-binding maps-server-api-key \
  --member serviceAccount:placetogo-api-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role roles/secretmanager.secretAccessor

# Budget alert (bukan hard cap)
gcloud billing budgets create --billing-account=BILLING_ID --display-name="placetogo-dev" \
  --budget-amount=JUMLAH --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0

# Alert policy
gcloud alpha monitoring policies create --policy-from-file=infrastructure/monitoring/alert-policy-api-5xx.json
```

Peran yang tepat untuk Firebase Auth Admin dan kebutuhan lain harus diverifikasi terhadap
dokumentasi IAM resmi sebelum dijalankan.
