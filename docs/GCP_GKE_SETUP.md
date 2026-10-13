# GCP & GKE Setup Guide

This document details the configuration and provisioning steps for Google Cloud Platform (GCP) resources required by the College Event Management System.

## 1. Prerequisites

- Google Cloud SDK (`gcloud` CLI) installed and authenticated.
- `kubectl` CLI installed.
- Docker installed and configured.

## 2. Project & Region Configuration

Set up environment variables and configure project properties:

```bash
# 1. Login and set project
gcloud auth login
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export ZONE="us-central1-a"
gcloud config set project $PROJECT_ID
```

## 3. Enable Required Google Cloud APIs

```bash
gcloud services enable \
    container.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com
```

## 4. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create campus-events-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for College Event Management System"
```

## 5. Provision Google Kubernetes Engine (GKE) Cluster

```bash
gcloud container clusters create campus-events-cluster \
    --zone $ZONE \
    --num-nodes 2 \
    --machine-type e2-standard-2 \
    --enable-ip-alias

# Fetch cluster credentials for local kubectl access
gcloud container clusters get-credentials campus-events-cluster --zone $ZONE
```

## 6. Service Account & IAM for CI/CD

Create a dedicated Google Cloud Service Account for GitHub Actions:

```bash
# Create service account
gcloud iam service-accounts create github-actions-sa \
    --display-name="GitHub Actions Deployment SA"

# Grant Artifact Registry Writer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Grant Kubernetes Engine Developer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.developer"

# Generate and export service account key
gcloud iam service-accounts keys create sa-key.json \
    --iam-account=github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com
```

