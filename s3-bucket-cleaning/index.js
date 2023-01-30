import AWS from 'aws-sdk';
import promptSync from 'prompt-sync';

let prompt = promptSync();

const s3 = new AWS.S3();

const filter = process.env.FILTER;

if(! filter) {
  console.log(`Use AWS_SECRET_ACCESS_KEY=blabla AWS_ACCESS_KEY_ID=blabla FILTER=xpto npm run start`);
  process.exit(0);
}

console.log(`Buckets filter: ${filter}`);

let list = await s3.listBuckets().promise();

const filtered = list.Buckets.filter(b => b.Name.startsWith(filter));

console.log(`Total items found: ${filtered.length}`);

if (filtered.length == 0) {
   process.exit(0);
}

console.log(`The following buckets will be removed`);

filtered.forEach(bucket => {
    if(bucket.Name.startsWith(filter)) {
       console.log(bucket);
    }
});

const input = prompt("\nPls, to proceed with the deletion confirm with 'Yes': ");

if(input.toUpperCase() !== "YES") {
  process.exit(0);
}

for(let i = 0; i < filtered.length; i++) {
  const bucket = filtered[i];

  const remove = prompt(`Confirms deletion of ${bucket.Name}? `);
  if(remove.toUpperCase() === "YES") {
     const objects = await s3.listObjects({ Bucket: bucket.Name }).promise();
     console.log(`Objects in bucket: ${objects.Contents.length}`);
     
     if (objects.Contents.length > 0) {
       const objectsToDelete = objects.Contents.map(o => { 
	  return {
		  "Key": o.Key
	  };
       });
       
       console.log(objectsToDelete);

       await s3.deleteObjects({ Bucket: bucket.Name, Delete: { Objects: objectsToDelete } }).promise();
       console.log("Objects deleted!");
     }

     await s3.deleteBucket({ Bucket: bucket.Name }).promise();
     console.log(`Bucket '${bucket.Name}' deleted!\n`);
  }
}

