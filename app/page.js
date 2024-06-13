"use client"
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import Header from './_components/header';
import Restaurant from './_components/restaurant';
import { storageRef, storage } from './_lib/firebase/clientApp'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from 'next/link';
import { getAuth } from "firebase/auth";
import { signInWithGoogle } from './_lib/firebase/auth';


export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [cvs, setCvs] = useState([]);
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const handleSignIn = event => {
    signInWithGoogle();
  };

  const uploadFiles = () => {
    const numFiles = cvs.length
    let completeFiles = 0
    const metadata = {
      customMetadata: {
        'requestId': 1,
      }

    };
    setDownloadLinks([])


    cvs.forEach(cv => {
      // Upload file and metadata to the object 'images/mountains.jpg'
      const storageRef = ref(storage, cv.name);
      const uploadTask = uploadBytesResumable(storageRef, cv, metadata);

      // Listen for state changes, errors, and completion of the upload.
      uploadTask.on('state_changed',
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;

            // ...

            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        },
        () => {
          // Upload completed successfully, now we can get the download URL
          completeFiles += 1
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            setDownloadLinks(prev => [...prev, downloadURL]);
          });
        }
      );
    })
  }

  const handleCvUpload = (event) => {
    const files = Array.from(event.target.files);
    setCvs(files);
  };
  const handleAnalyze = async () => {
    if (!auth.currentUser) {
      await handleSignIn();
    }
    if (jobDescription.length >= 300 && cvs.length > 0) {
      // setIsLoading(true);
      // // Simulate waiting for backend response
      // setTimeout(() => {
      //   setIsLoading(false);
      //   router.push('/candidates');
      // }, 30000);
      uploadFiles()
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black">

      <Head>
        <title>AI CV Evaluation</title>
      </Head>

      <header className="absolute top-4 right-4">
        <Header />
      </header>
      <Restaurant />

      <main className="flex flex-col items-center">
        <h1 className="mb-6 text-4xl font-bold">Evaluate a CV of a candidate with AI</h1>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-96">
            <textarea
              className={`w-full p-4 bg-gray-800 border ${jobDescription.length < 300 ? 'border-red-500' : 'border-green-500'} rounded-lg focus:outline-none focus:border ${jobDescription.length < 300 ? 'focus:border-red-500' : 'focus:border-green-500'}`}
              placeholder="Paste your job description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
            <div className={`absolute bottom-2 right-2 text-sm ${jobDescription.length < 300 ? 'text-red-500' : 'text-green-500'}`}>
              {jobDescription.length}/300
            </div>
          </div>




          <label className="p-4 text-center bg-gray-800 border border-gray-700 rounded-lg cursor-pointer w-96">
            {cvs.length > 0 ? `${cvs.length} CV(s) uploaded` : 'Upload some CV'}
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleCvUpload}
            />
          </label>

          <button
            className={`w-96 p-4 rounded-lg ${jobDescription.length >= 300 && cvs.length > 0 ? 'bg-green-600' : 'bg-gray-600 cursor-not-allowed'}`}
            onClick={handleAnalyze}
            disabled={!(jobDescription.length >= 300 && cvs.length > 0)}
          >
            {isLoading ? 'Analyzing...' : cvs.length > 0 ? `Analyze (${10 * cvs.length} tokens)` : 'Analyze (10 tokens per CV)'}
          </button>

          {isLoading && <div className="loader"></div>}
        </div>
        <div className='flex flex-col gap-4 p-4 mt-12 bg-gray-100 rounded shadow'>
          <h1 className="mb-4 text-2xl font-bold">Uploaded files</h1>
          {downloadLinks.map((url, index) => (
            <Link key={index} href={url} passHref>
              <div className='block p-2 text-blue-500 bg-white rounded cursor-pointer hover:bg-gray-200'>
                {url}
              </div>
            </Link>
          ))}
        </div>
      </main >

      <style jsx>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid white;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div >
  );
}
