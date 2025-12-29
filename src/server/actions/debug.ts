"use server";

export async function logEnvVarsToServer(){
    console.log('Next.js Config:', {
  env: process.env,
  publicRuntimeConfig: process.env
});
return {success : true}
}