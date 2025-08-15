#!/usr/bin/env python3
"""
Upload TreeAI Encyclopedia Documents to Convex File Storage
"""

import asyncio
import httpx
import os
from datetime import datetime

async def upload_file_to_convex(file_path: str, convex_url: str) -> str:
    """Upload a file to Convex File Storage"""
    
    filename = os.path.basename(file_path)
    print(f"📄 Uploading {filename}...")
    
    try:
        # Read the file
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        async with httpx.AsyncClient(timeout=60) as client:
            # Step 1: Generate upload URL
            response = await client.post(
                f"{convex_url}/api/mutation",
                json={
                    "path": "files:generateUploadUrl",
                    "args": {}
                }
            )
            
            if response.status_code != 200:
                print(f"   ❌ Failed to generate upload URL: {response.status_code}")
                return None
            
            upload_data = response.json()
            upload_url = upload_data.get('value', {}).get('uploadUrl')
            storage_id = upload_data.get('value', {}).get('storageId')
            
            if not upload_url or not storage_id:
                print(f"   ❌ Invalid upload response")
                return None
            
            # Step 2: Upload file to generated URL
            upload_response = await client.post(
                upload_url,
                files={
                    'file': (filename, file_content, 'text/markdown')
                }
            )
            
            if upload_response.status_code != 200:
                print(f"   ❌ File upload failed: {upload_response.status_code}")
                return None
            
            # Step 3: Save file metadata
            metadata_response = await client.post(
                f"{convex_url}/api/mutation",
                json={
                    "path": "files:saveFileMetadata",
                    "args": {
                        "storageId": storage_id,
                        "name": filename,
                        "type": "text/markdown",
                        "size": len(file_content),
                        "category": "encyclopedia",
                        "description": f"TreeAI Encyclopedia Document: {filename}",
                        "uploadedAt": int(datetime.now().timestamp() * 1000)
                    }
                }
            )
            
            if metadata_response.status_code == 200:
                file_id = metadata_response.json().get('value')
                print(f"   ✅ Successfully uploaded: {file_id}")
                return file_id
            else:
                print(f"   ⚠️  File uploaded but metadata save failed: {metadata_response.status_code}")
                return storage_id
                
    except Exception as e:
        print(f"   ❌ Upload error: {str(e)}")
        return None

async def main():
    """Upload all encyclopedia documents to Convex"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("📚 TreeAI Encyclopedia Upload to Convex File Storage")
    print("=" * 60)
    print(f"Target: {convex_url}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Files to upload
    files_to_upload = [
        "afiss_factor_encyclopedia.md",
        "equipment_cost_intelligence_manual.md", 
        "employee_burden_cost_guide.md"
    ]
    
    upload_results = []
    
    for filename in files_to_upload:
        file_path = f"/Users/ain/TreeAI-Agent-Kit/agents/treeai-operations/alex-standalone/{filename}"
        
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"\n📄 File: {filename} ({file_size:,} bytes)")
            
            file_id = await upload_file_to_convex(file_path, convex_url)
            upload_results.append({
                "filename": filename,
                "file_id": file_id,
                "success": file_id is not None,
                "size": file_size
            })
        else:
            print(f"\n❌ File not found: {filename}")
            upload_results.append({
                "filename": filename,
                "file_id": None,
                "success": False,
                "size": 0
            })
    
    # Summary
    print(f"\n📋 UPLOAD SUMMARY")
    print("=" * 60)
    
    successful_uploads = [r for r in upload_results if r["success"]]
    failed_uploads = [r for r in upload_results if not r["success"]]
    
    print(f"✅ Successful uploads: {len(successful_uploads)}")
    for result in successful_uploads:
        print(f"   • {result['filename']}: {result['file_id']} ({result['size']:,} bytes)")
    
    if failed_uploads:
        print(f"\n❌ Failed uploads: {len(failed_uploads)}")
        for result in failed_uploads:
            print(f"   • {result['filename']}")
    
    total_size = sum(r["size"] for r in successful_uploads)
    print(f"\n📊 Total uploaded: {total_size:,} bytes")
    
    if successful_uploads:
        print(f"\n🎉 Encyclopedia documents uploaded successfully!")
        print(f"📁 Check your Convex dashboard File Storage:")
        print(f"   https://dashboard.convex.dev/t/cvo-treeai/alex-standalone/cheerful-bee-330/files")
        
        print(f"\n📚 Available Documents:")
        print(f"   • AFISS Factor Encyclopedia: Complete 340+ factor reference")
        print(f"   • Equipment Cost Intelligence Manual: USACE methodology guide")
        print(f"   • Employee Burden Cost Guide: True labor cost analysis")
        
        print(f"\n💡 These documents provide:")
        print(f"   🎯 Complete pricing intelligence methodology")
        print(f"   📖 Training materials for operators")
        print(f"   📊 Industry benchmarks and best practices")
        print(f"   🔧 Implementation guidelines")
    else:
        print(f"\n⚠️  No files were uploaded successfully.")
        print(f"    This may be because Convex file storage functions are not yet implemented.")
        print(f"    The encyclopedia documents are ready and available locally.")

if __name__ == "__main__":
    asyncio.run(main())